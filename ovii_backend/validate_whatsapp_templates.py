#!/usr/bin/env python
"""
Validation script for WhatsApp templates.

This script validates all WhatsApp templates against Meta API requirements:
1. AUTHENTICATION templates with OTP buttons use add_security_recommendation
2. Templates have sufficient text-to-variable ratio
3. Variables are not at the start or end of the text
4. All required fields are present

Run this before syncing templates to Meta API.

Author: Moreblessing Nyemba
Copyright: © 2025 Ovii. All Rights Reserved.
"""

import sys
import json
from typing import Dict, List, Tuple

# Add parent directory to path to import from integrations
sys.path.insert(0, '/home/runner/work/ovii/ovii/ovii_backend')

from integrations.whatsapp_templates import (
    get_all_templates,
    convert_template_to_meta_format,
    WHATSAPP_TEMPLATES
)


class TemplateValidator:
    """Validates WhatsApp templates against Meta API requirements."""
    
    # Meta's requirements
    MIN_CHARS_PER_VARIABLE = 20  # Conservative estimate
    MIN_TEXT_BEFORE_FIRST_VARIABLE = 5
    MIN_TEXT_AFTER_LAST_VARIABLE = 5
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.passed_checks = []
    
    def validate_all_templates(self) -> bool:
        """
        Validate all templates.
        
        Returns:
            bool: True if all validations pass, False otherwise
        """
        templates = get_all_templates()
        
        print("=" * 80)
        print("WHATSAPP TEMPLATE VALIDATION")
        print("=" * 80)
        print()
        
        for template_name in templates.keys():
            self._validate_template(template_name)
            print()
        
        return self._print_summary()
    
    def _validate_template(self, template_name: str) -> None:
        """Validate a single template."""
        print(f"Validating: {template_name}")
        print("-" * 40)
        
        try:
            # Get template data
            template_data = WHATSAPP_TEMPLATES[template_name]
            
            # Convert to Meta format
            payload = convert_template_to_meta_format(template_name)
            
            # Run validation checks
            self._check_required_fields(template_name, payload)
            self._check_body_component(template_name, template_data, payload)
            self._check_variable_ratio(template_name, template_data, payload)
            self._check_variable_position(template_name, payload)
            
            print(f"✓ {template_name}: All checks passed")
            
        except Exception as e:
            error_msg = f"{template_name}: Validation error - {e}"
            self.errors.append(error_msg)
            print(f"✗ {error_msg}")
    
    def _check_required_fields(self, template_name: str, payload: Dict) -> None:
        """Check that all required fields are present."""
        required_fields = ['name', 'category', 'language', 'components']
        
        for field in required_fields:
            if field not in payload:
                raise ValueError(f"Missing required field: {field}")
        
        if not payload['components']:
            raise ValueError("Components list is empty")
        
        # Check for BODY component
        has_body = any(c['type'] == 'BODY' for c in payload['components'])
        if not has_body:
            raise ValueError("Missing BODY component")
    
    def _check_body_component(
        self, 
        template_name: str, 
        template_data: Dict, 
        payload: Dict
    ) -> None:
        """Check BODY component format."""
        body_component = next(
            c for c in payload['components'] if c['type'] == 'BODY'
        )
        
        # Check for AUTHENTICATION + OTP combination
        has_otp_button = any(
            btn.get('type') == 'OTP' 
            for btn in template_data['structure'].get('buttons', [])
        )
        
        if template_data['category'] == 'AUTHENTICATION' and has_otp_button:
            # Should have add_security_recommendation, not text
            if 'text' in body_component:
                raise ValueError(
                    "AUTHENTICATION+OTP templates should not have 'text' field in BODY"
                )
            if 'add_security_recommendation' not in body_component:
                raise ValueError(
                    "AUTHENTICATION+OTP templates must have 'add_security_recommendation'"
                )
        else:
            # Should have text field
            if 'text' not in body_component:
                raise ValueError("BODY component missing 'text' field")
    
    def _check_variable_ratio(
        self, 
        template_name: str, 
        template_data: Dict, 
        payload: Dict
    ) -> None:
        """Check text-to-variable ratio."""
        body_component = next(
            c for c in payload['components'] if c['type'] == 'BODY'
        )
        
        # Skip for AUTHENTICATION+OTP templates (they don't have text field)
        if 'text' not in body_component:
            return
        
        text = body_component['text']
        variable_count = text.count('{{')
        
        if variable_count == 0:
            return  # No variables, no ratio check needed
        
        text_length = len(text)
        ratio = text_length / variable_count
        
        if ratio < self.MIN_CHARS_PER_VARIABLE:
            self.warnings.append(
                f"{template_name}: Text-to-variable ratio is low ({ratio:.1f} chars/var). "
                f"Consider adding more text (Meta recommends ~{self.MIN_CHARS_PER_VARIABLE}+ chars per variable)."
            )
        
        # Log the ratio for information
        self.passed_checks.append(
            f"{template_name}: Text ratio OK ({text_length} chars, {variable_count} vars, "
            f"{ratio:.1f} chars/var)"
        )
    
    def _check_variable_position(self, template_name: str, payload: Dict) -> None:
        """Check that variables are not at start or end of text."""
        body_component = next(
            c for c in payload['components'] if c['type'] == 'BODY'
        )
        
        # Skip for AUTHENTICATION+OTP templates (they don't have text field)
        if 'text' not in body_component:
            return
        
        text = body_component['text']
        
        if not text:
            return
        
        # Check for leading variable
        if text.startswith('{{'):
            raise ValueError(
                f"Template starts with a variable. Meta requires text before the first variable."
            )
        
        # Check for trailing variable
        if text.endswith('}}'):
            self.warnings.append(
                f"{template_name}: Template ends with a variable. "
                "This may be rejected by Meta."
            )
        
        # Check minimum text before first variable
        if '{{' in text:
            first_var_pos = text.index('{{')
            if first_var_pos < self.MIN_TEXT_BEFORE_FIRST_VARIABLE:
                self.warnings.append(
                    f"{template_name}: Very short text before first variable ({first_var_pos} chars). "
                    "Consider adding more introductory text."
                )
    
    def _print_summary(self) -> bool:
        """Print validation summary and return success status."""
        print("=" * 80)
        print("VALIDATION SUMMARY")
        print("=" * 80)
        
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  • {error}")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        if not self.errors and not self.warnings:
            print("\n✅ ALL TEMPLATES PASSED VALIDATION!")
            print("\nTemplates are ready to sync to Meta API.")
        elif not self.errors:
            print("\n✅ NO ERRORS FOUND")
            print("⚠️  Please review warnings before syncing to Meta API.")
        else:
            print("\n❌ VALIDATION FAILED")
            print("Please fix errors before syncing to Meta API.")
        
        print()
        return len(self.errors) == 0


def main():
    """Main entry point."""
    validator = TemplateValidator()
    success = validator.validate_all_templates()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
