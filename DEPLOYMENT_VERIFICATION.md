# Deployment Verification Checklist

Use this checklist after deploying the fixes to verify everything works correctly.

## Pre-Deployment Checklist

- [ ] Review changes in this PR
- [ ] Read `ISSUE_FIX_SUMMARY.md`
- [ ] Read `WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md`
- [ ] Backup production database
- [ ] Plan deployment window

## Deployment Steps

1. [ ] Pull latest changes
   ```bash
   cd ~/ovii
   git pull origin main
   ```

2. [ ] Restart services
   ```bash
   docker compose restart backend celery_worker celery_beat
   ```

3. [ ] Verify no static files warning
   ```bash
   docker compose exec backend python manage.py check
   ```
   Expected: No `staticfiles.W004` warning

4. [ ] Verify no environment variable warnings
   ```bash
   docker compose logs db 2>&1 | head -20
   ```
   Expected: No "POSTGRES_USER" or "POSTGRES_DB" warnings

## WhatsApp Configuration

5. [ ] Generate webhook verify token
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

6. [ ] Add to `.env` file
   ```bash
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=<your_generated_token>
   ```

7. [ ] Restart backend
   ```bash
   docker compose restart backend
   ```

8. [ ] Configure webhook in Meta Developer Console
   - URL: `https://api.ovii.it.com/api/integrations/webhooks/whatsapp/`
   - Verify Token: (the token from step 5)
   - Subscribe to: `messages`, `message_status`

9. [ ] Sync WhatsApp templates
   ```bash
   docker compose exec backend python manage.py sync_whatsapp_templates
   ```
   Expected: All templates sync successfully or show as approved

10. [ ] Check template status
    ```bash
    docker compose exec backend python manage.py sync_whatsapp_templates --check-status
    ```

## Code Updates (If Applicable)

11. [ ] Update code that uses WhatsApp templates
    - Follow `WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md`
    - Update variable format from separate to combined

12. [ ] Test updated code in development
    ```bash
    # Test in Django shell
    docker compose exec backend python manage.py shell
    ```

13. [ ] Deploy updated code
    ```bash
    git push origin main
    docker compose restart backend
    ```

## Post-Deployment Verification

14. [ ] Monitor logs for errors
    ```bash
    docker compose logs -f backend | grep -i error
    ```

15. [ ] Test WhatsApp template sending
    ```bash
    docker compose exec backend python manage.py shell
    ```
    ```python
    from notifications.services import send_whatsapp_template
    
    # Test with approved template
    send_whatsapp_template(
        phone_number="+263777123456",  # Your test number
        template_name="welcome_message",
        variables={"user_name": "Test"}
    )
    ```

16. [ ] Verify webhook receives messages
    - Send a WhatsApp message to your business number
    - Check logs: `docker compose logs -f backend | grep -i webhook`

17. [ ] Check all services are running
    ```bash
    docker compose ps
    ```
    All services should show "Up" status

18. [ ] Check Celery workers
    ```bash
    docker compose exec celery_worker celery -A ovii_backend inspect active
    ```

## Rollback Plan (If Needed)

If issues occur:

1. [ ] Revert to previous version
   ```bash
   git checkout <previous_commit_hash>
   docker compose restart backend
   ```

2. [ ] Restore database backup (if needed)
   ```bash
   docker compose exec -T db psql -U ovii_prod_user ovii_prod_db < backup_file.sql
   ```

3. [ ] Check logs for specific errors
   ```bash
   docker compose logs --tail=100 backend
   ```

## Success Criteria

All of the following should be true:

- ✅ No static files warnings
- ✅ No environment variable warnings
- ✅ All WhatsApp templates sync successfully
- ✅ Webhook configured and receiving messages
- ✅ No errors in backend logs
- ✅ All Docker services running
- ✅ Celery workers processing tasks
- ✅ Test WhatsApp messages sent successfully

## Notes

- Document any issues encountered: _______________
- Deployment time: _______________
- Deployed by: _______________
- Rollback required: Yes / No

## Related Documentation

- [ISSUE_FIX_SUMMARY.md](./ISSUE_FIX_SUMMARY.md) - Quick reference
- [FULL_COMMANDS_REFERENCE.md](./FULL_COMMANDS_REFERENCE.md) - All commands
- [WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md](./WHATSAPP_TEMPLATE_MIGRATION_GUIDE.md) - Code migration guide
- [WEBHOOK_SETUP_GUIDE.md](./WEBHOOK_SETUP_GUIDE.md) - Webhook setup details
