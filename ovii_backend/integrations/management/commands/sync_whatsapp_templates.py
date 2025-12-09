"""
Author: Moreblessing Nyemba +263787211325
Date: 2024-12-09
Description: Management command to sync WhatsApp message templates with Meta.

This command displays the template definitions that need to be created in Meta Business Manager.
Templates must be created manually in the Meta Business Manager at:
https://business.facebook.com/wa/manage/message-templates/
"""

from django.core.management.base import BaseCommand
from integrations.whatsapp_templates import get_all_templates
import json


class Command(BaseCommand):
    help = "Display WhatsApp message templates for syncing with Meta Business Manager"

    def add_arguments(self, parser):
        parser.add_argument(
            '--format',
            type=str,
            default='text',
            choices=['text', 'json'],
            help='Output format: text or json',
        )

    def handle(self, *args, **options):
        templates = get_all_templates()
        output_format = options['format']

        if output_format == 'json':
            self.stdout.write(json.dumps(templates, indent=2))
            return

        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('OVII WHATSAPP MESSAGE TEMPLATES'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write('')
        
        self.stdout.write(self.style.WARNING(
            'These templates must be created and approved in Meta Business Manager.'
        ))
        self.stdout.write(self.style.WARNING(
            'URL: https://business.facebook.com/wa/manage/message-templates/'
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
                    self.stdout.write(f"    {{{{{{i}}}}}}: {var}")
            
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
        self.stdout.write(self.style.WARNING('NEXT STEPS:'))
        self.stdout.write('1. Log in to Meta Business Manager')
        self.stdout.write('2. Navigate to WhatsApp Manager > Message Templates')
        self.stdout.write('3. Create each template with the exact name and structure shown above')
        self.stdout.write('4. Submit templates for approval')
        self.stdout.write('5. Wait for Meta to approve the templates (usually 24-48 hours)')
        self.stdout.write('6. Once approved, templates can be used in the application')
        self.stdout.write('')
