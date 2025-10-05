from django.contrib import admin
from django.contrib import messages
from .models import Agent
from users.models import OviiUser
from users.tasks import send_realtime_notification

@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ('user', 'business_name', 'agent_code', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('user__phone_number', 'business_name', 'agent_code')
    actions = ['approve_agents']
    raw_id_fields = ('user',)
    ordering = ('-created_at',)

    @admin.action(description='Approve selected agents and set their role')
    def approve_agents(self, request, queryset):
        """
        Custom admin action to approve a new agent. It sets the agent's
        `is_approved` flag to True and updates the associated user's role
        to 'AGENT'.
        """
        approved_count = 0
        already_approved_count = 0

        # We use select_related to pre-fetch the user object, avoiding extra DB queries.
        for agent in queryset.select_related('user'):
            if agent.is_approved and agent.user.role == OviiUser.Role.AGENT:
                already_approved_count += 1
                continue

            agent.is_approved = True
            agent.user.role = OviiUser.Role.AGENT
            agent.save(update_fields=['is_approved'])
            agent.user.save(update_fields=['role'])

            send_realtime_notification.delay(
                agent.user.id,
                "Congratulations! Your agent account has been approved and is now active."
            )
            approved_count += 1

        if approved_count > 0:
            self.message_user(request, f'{approved_count} agents were successfully approved and activated.')
        if already_approved_count > 0:
            self.message_user(request, f'{already_approved_count} agents were already approved.', level=messages.WARNING)