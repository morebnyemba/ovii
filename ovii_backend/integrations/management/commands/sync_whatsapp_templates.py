"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-09
Updated: 2024-12-16
Description: Management command to sync WhatsApp message templates with Meta.

This command can:
1. Display templates (--display-only) - shows templates without syncing
2. Sync templates to Meta (default) - creates/updates templates via Graph API
3. Check template status (--check-status) - retrieves approval status from Meta
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from integrations.whatsapp_templates import get_all_templates, convert_template_to_meta_format
from integrations.services import WhatsAppClient
from integrations.models import WhatsAppTemplate
import json
import logging
import requests

# Constants
MAX_REJECTION_REASON_LENGTH = 500  # Maximum length for rejection reason in database

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Sync WhatsApp message templates with Meta Business Manager via Graph API"

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            default='text',
            choices=['text', 'json'],
            help='Output format: text or json (for --display-only)',
        )
        parser.add_argument(
            '--display-only',
            action='store_true',
            help='Display templates without syncing to Meta',
        )
        parser.add_argument(
            '--check-status',
            action='store_true',
            help='Check approval status of templates from Meta',
        )
        parser.add_argument(
            '--template',
            type=str,
            help='Sync only a specific template by name',
        )

    def handle(self, *args, **options):
        templates = get_all_templates()
        output_format = options['format']
        display_only = options['display_only']
        check_status = options['check_status']
        specific_template = options.get('template')

        # Filter to specific template if requested
        if specific_template:
            if specific_template not in templates:
                raise CommandError(f"Template '{specific_template}' not found")
            templates = {specific_template: templates[specific_template]}

        # Display only mode (original behavior)
        if display_only:
            self._display_templates(templates, output_format)
            return

        # Check status mode
        if check_status:
            self._check_template_status(templates)
            return

        # Sync templates to Meta (new behavior)
        self._sync_templates_to_meta(templates)

    def _display_templates(self, templates, output_format):
        """Display templates in text or JSON format."""
        if output_format == 'json':
            self.stdout.write(json.dumps(templates, indent=2))
            return

        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('OVII WHATSAPP MESSAGE TEMPLATES'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write('')
        
        self.stdout.write(self.style.WARNING(
            'These templates can be synced to Meta Business Manager automatically.'
        ))
        self.stdout.write(self.style.WARNING(
            'Run: python manage.py sync_whatsapp_templates (without --display-only)'
        ))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('=' * 80))
        self.stdout.write('')

        for template_key, template_data in templates.items():
            self.stdout.write(self.style.HTTP_INFO(f"Template: {template_data['name']}"))
            self.stdout.write(f"  Category: {template_data['category']}")
            self.stdout.write(f"  Language: {template_data['language']}")
            self.stdout.write(f"  Description: {template_data['description']}")
            self.stdout.write('')
            
            # Display structure
            self.stdout.write(self.style.SUCCESS("  Structure:"))
            structure = template_data['structure']
            
            if structure.get('header'):
                self.stdout.write(f"    Header: {structure['header']}")
            
            if structure.get('body'):
                self.stdout.write(f"    Body:")
                body_lines = structure['body'].split('\n')
                for line in body_lines:
                    self.stdout.write(f"      {line}")
            
            if structure.get('footer'):
                self.stdout.write(f"    Footer: {structure['footer']}")
            
            # Display variables
            if template_data.get('variables'):
                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS("  Variables:"))
                for i, var in enumerate(template_data['variables'], start=1):
                    self.stdout.write(f"    {{{{{i}}}}}: {var}")
            
            # Display example
            if template_data.get('example'):
                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS("  Example Values:"))
                for example_values in template_data['example']['body_text']:
                    self.stdout.write(f"    {', '.join(example_values)}")
            
            self.stdout.write('')
            self.stdout.write('-' * 80)
            self.stdout.write('')

        self.stdout.write(self.style.SUCCESS('Total templates: ' + str(len(templates))))
        self.stdout.write('')

    def _normalize_language_code(self, lang_code):
        """
        Normalize language code for comparison.
        Handles variations like 'en', 'en_US', 'en-US'.
        Returns the base language code (e.g., 'en').
        """
        if not lang_code:
            return ''
        # Replace hyphens with underscores for consistency
        normalized = lang_code.replace('-', '_')
        # Split on underscore and take the first part (base language)
        return normalized.split('_')[0].lower()
    
    def _languages_match(self, lang1, lang2):
        """
        Check if two language codes match.
        Matches base language codes regardless of regional variants.
        Examples:
        - 'en' matches 'en_US' -> True
        - 'en_US' matches 'en' -> True
        - 'en_US' matches 'en_GB' -> True (both are English)
        - 'en' matches 'es' -> False
        """
        base1 = self._normalize_language_code(lang1)
        base2 = self._normalize_language_code(lang2)
        return base1 == base2


    def _sync_templates_to_meta(self, templates):
        """Sync templates to Meta via Graph API."""
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('SYNCING TEMPLATES TO META'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write('')

        try:
            client = WhatsAppClient()
            if not client.waba_id:
                raise CommandError(
                    "WABA_ID not configured. Please set WHATSAPP_WABA_ID in .env or "
                    "add waba_id to WhatsApp configuration in admin panel."
                )
        except Exception as e:
            raise CommandError(f"Failed to initialize WhatsApp client: {e}")

        success_count = 0
        failed_count = 0
        skipped_count = 0

        for template_name, template_data in templates.items():
            self.stdout.write(f"Processing template: {template_name}")
            
            try:
                # Get or create database record
                db_template, created = WhatsAppTemplate.objects.get_or_create(
                    name=template_name,
                    language=template_data['language'],
                    defaults={
                        'category': template_data['category'],
                        'status': 'PENDING',
                    }
                )
                
                # First, check if template exists in Meta
                self.stdout.write(f"  Checking template status in Meta...")
                try:
                    status_response = client.get_template_status(template_name)
                    templates_in_meta = status_response.get('data', [])
                    
                    if templates_in_meta:
                        # Template exists in Meta
                        # Find the matching language version
                        matching_template = None
                        for meta_template in templates_in_meta:
                            meta_lang = meta_template.get('language', '')
                            template_lang = template_data['language']
                            
                            # Use helper method for proper language matching
                            if self._languages_match(meta_lang, template_lang):
                                matching_template = meta_template
                                break
                        
                        if matching_template:
                            template_id = matching_template.get('id')
                            template_status = matching_template.get('status', 'UNKNOWN').upper()
                            
                            # Update database with current Meta status
                            db_template.template_id = template_id
                            db_template.status = template_status
                            db_template.last_synced_at = timezone.now()
                            db_template.save()
                            
                            # Check if we should skip or update
                            if template_status == 'APPROVED':
                                self.stdout.write(
                                    self.style.SUCCESS(f"  ✓ Template already exists in Meta and is APPROVED")
                                )
                                self.stdout.write(f"    Template ID: {template_id}")
                                skipped_count += 1
                                self.stdout.write('')
                                continue
                            elif template_status == 'PENDING':
                                self.stdout.write(
                                    self.style.WARNING(f"  ⏭  Template already exists and is PENDING approval")
                                )
                                self.stdout.write(f"    Template ID: {template_id}")
                                skipped_count += 1
                                self.stdout.write('')
                                continue
                            elif template_status == 'REJECTED':
                                self.stdout.write(
                                    self.style.WARNING(f"  ⚠  Template exists but was REJECTED. Will attempt to create new version...")
                                )
                                # Continue to creation attempt for rejected templates
                            else:
                                self.stdout.write(
                                    self.style.WARNING(f"  ℹ  Template exists with status: {template_status}. Will attempt to create/update...")
                                )
                                # Continue to creation attempt for unknown statuses
                        else:
                            self.stdout.write(f"  Template not found for language '{template_data['language']}', will create...")
                    else:
                        self.stdout.write(f"  Template does not exist in Meta, will create...")
                    
                except (requests.RequestException, ValueError, KeyError) as check_error:
                    # If checking fails, log it but continue with creation attempt
                    error_type = type(check_error).__name__
                    logger.warning(f"Template status check failed for '{template_name}': {error_type} - {check_error}")
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠  Could not check template status: {error_type}")
                    )
                    self.stdout.write(f"  Proceeding with creation attempt...")
                except Exception as check_error:
                    # Catch-all for unexpected errors
                    error_type = type(check_error).__name__
                    logger.error(f"Unexpected error checking template '{template_name}': {error_type} - {check_error}")
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠  Unexpected error: {error_type}")
                    )
                    self.stdout.write(f"  Proceeding with creation attempt...")
                
                # Convert to Meta format and create (only if we didn't skip above)
                meta_payload = convert_template_to_meta_format(template_name)
                
                # Create template in Meta
                try:
                    response = client.create_template(meta_payload)
                    
                    # Update database record
                    db_template.template_id = response.get('id')
                    db_template.status = response.get('status', 'PENDING').upper()
                    db_template.last_synced_at = timezone.now()
                    db_template.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Template created successfully (ID: {response.get('id')})")
                    )
                    self.stdout.write(
                        self.style.WARNING(f"    Status: {response.get('status', 'PENDING')}")
                    )
                    success_count += 1
                    
                except Exception as api_error:
                    error_msg = str(api_error)
                    
                    # Check if template already exists using status code/error code
                    is_duplicate = getattr(api_error, 'is_duplicate', False)
                    
                    if is_duplicate:
                        # Handle race condition: template may have been created between 
                        # our status check and creation attempt
                        db_template.last_synced_at = timezone.now()
                        db_template.save()
                        self.stdout.write(
                            self.style.WARNING(f"  ⚠  Template already exists in Meta (race condition)")
                        )
                        self.stdout.write(
                            self.style.WARNING(f"    Run sync again to update status from Meta")
                        )
                        skipped_count += 1
                    else:
                        # Real error - store truncated rejection reason
                        db_template.rejection_reason = error_msg[:MAX_REJECTION_REASON_LENGTH]
                        db_template.save()
                        self.stdout.write(
                            self.style.ERROR(f"  ✗ Failed: {error_msg}")
                        )
                        failed_count += 1
                
            except (ValueError, KeyError) as e:
                # Handle data/parsing errors
                error_type = type(e).__name__
                logger.error(f"Data error processing template '{template_name}': {error_type} - {e}")
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Data error ({error_type}): {e}")
                )
                failed_count += 1
            except Exception as e:
                # Catch-all for unexpected errors
                error_type = type(e).__name__
                logger.error(f"Unexpected error processing template '{template_name}': {error_type} - {e}")
                self.stdout.write(
                    self.style.ERROR(f"  ✗ Unexpected error ({error_type}): {e}")
                )
                failed_count += 1
            
            self.stdout.write('')

        # Summary
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('SYNC SUMMARY'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(f"Total templates: {len(templates)}")
        self.stdout.write(self.style.SUCCESS(f"✓ Successfully synced: {success_count}"))
        self.stdout.write(self.style.WARNING(f"⏭  Skipped: {skipped_count}"))
        self.stdout.write(self.style.ERROR(f"✗ Failed: {failed_count}"))
        self.stdout.write('')
        
        if success_count > 0:
            self.stdout.write(self.style.WARNING('NOTE: Templates are pending approval by Meta.'))
            self.stdout.write(self.style.WARNING('Approval usually takes 24-48 hours.'))
            self.stdout.write(self.style.WARNING('Use --check-status to check approval status.'))
            self.stdout.write('')

    def _check_template_status(self, templates):
        """Check template approval status from Meta."""
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('CHECKING TEMPLATE STATUS'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write('')

        try:
            client = WhatsAppClient()
            if not client.waba_id:
                raise CommandError("WABA_ID not configured.")
        except Exception as e:
            raise CommandError(f"Failed to initialize WhatsApp client: {e}")

        for template_name, template_data in templates.items():
            self.stdout.write(f"Template: {template_name}")
            
            try:
                # Get status from Meta
                status_response = client.get_template_status(template_name)
                
                # Update database if template exists
                db_templates = WhatsAppTemplate.objects.filter(
                    name=template_name,
                    language=template_data['language']
                )
                
                if status_response.get('data'):
                    for template_info in status_response['data']:
                        status = template_info.get('status', 'UNKNOWN').upper()
                        template_id = template_info.get('id')
                        
                        self.stdout.write(f"  Status: {status}")
                        self.stdout.write(f"  Template ID: {template_id}")
                        
                        # Update database
                        if db_templates.exists():
                            db_template = db_templates.first()
                            db_template.status = status
                            db_template.template_id = template_id
                            db_template.save()
                else:
                    self.stdout.write(self.style.WARNING("  Not found in Meta"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Error: {e}"))
            
            self.stdout.write('')
