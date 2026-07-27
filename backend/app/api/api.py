from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, clients, locations, calls, appointments, analytics, patients, users, clinic
from app.ai.routers import ai_profile, knowledge, conversations, voice
from app.communication.webhooks.routers import router as communication_router
from app.integrations.routers.providers import router as integrations_providers_router
from app.integrations.routers.sync import router as integrations_sync_router
from app.integrations.routers.logs import router as integrations_logs_router
from app.integrations.routers.webhooks import router as integrations_webhooks_router
from app.integrations.routers.mapping import router as integrations_mapping_router
from app.scheduling.routers.settings import router as scheduling_settings_router
from app.revenue.routers.dashboard import router as revenue_dashboard_router
from app.revenue.routers.patients import router as revenue_patients_router
from app.revenue.routers.tasks import router as revenue_tasks_router
from app.revenue.routers.automation import router as revenue_automation_router

from app.analytics.routers.dashboard import router as analytics_dashboard_router
from app.analytics.routers.kpi import router as analytics_kpi_router
from app.analytics.routers.reports import router as analytics_reports_router
from app.analytics.routers.assistant import router as analytics_assistant_router

from app.marketing.routers.campaigns import router as marketing_campaigns_router
from app.marketing.routers.ai_studio import router as marketing_ai_studio_router
from app.marketing.routers.journeys import router as marketing_journeys_router
from app.marketing.routers.reviews import router as marketing_reviews_router
from app.marketing.routers.leads import router as marketing_leads_router
from app.marketing.routers.social import router as marketing_social_router
from app.marketing.routers.landing_pages import router as marketing_landing_pages_router
from app.marketing.routers.dashboard import router as marketing_dashboard_router

from app.admin.routers.dashboard import router as admin_dashboard_router
from app.admin.routers.tenants import router as admin_tenants_router
from app.admin.routers.subscriptions import router as admin_subscriptions_router
from app.admin.routers.billing import router as admin_billing_router
from app.admin.routers.usage import router as admin_usage_router
from app.admin.routers.feature_flags import router as admin_feature_flags_router
from app.admin.routers.support import router as admin_support_router
from app.admin.routers.monitoring import router as admin_monitoring_router
from app.admin.routers.security import router as admin_security_router

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(calls.router, prefix="/calls", tags=["calls"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["appointments"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(clinic.router, prefix="/clinic", tags=["clinic"])
api_router.include_router(scheduling_settings_router, prefix="/scheduling/settings", tags=["scheduling"])

# ── AI Brain ────────────────────────────────────────────────────────────────
api_router.include_router(ai_profile.router)
api_router.include_router(voice.router)
api_router.include_router(knowledge.router)
api_router.include_router(conversations.router)

# ── Communication ───────────────────────────────────────────────────────────
api_router.include_router(communication_router, prefix="/communication", tags=["communication"])

# ── PMS Integration Hub ─────────────────────────────────────────────────────
api_router.include_router(integrations_providers_router)
api_router.include_router(integrations_sync_router)
api_router.include_router(integrations_logs_router)
api_router.include_router(integrations_webhooks_router)
api_router.include_router(integrations_mapping_router)

# ── Revenue Recovery & Recall ───────────────────────────────────────────────
api_router.include_router(revenue_dashboard_router, prefix="/revenue", tags=["revenue"])
api_router.include_router(revenue_patients_router, prefix="/revenue/patients", tags=["revenue"])
api_router.include_router(revenue_tasks_router, prefix="/revenue/tasks", tags=["revenue"])
api_router.include_router(revenue_automation_router, prefix="/revenue/automation", tags=["revenue"])

# ── Analytics & Business Intelligence ───────────────────────────────────────
api_router.include_router(analytics_dashboard_router, prefix="/analytics/dashboard", tags=["analytics"])
api_router.include_router(analytics_kpi_router, prefix="/analytics/kpi", tags=["analytics"])
api_router.include_router(analytics_reports_router, prefix="/analytics/reports", tags=["analytics"])
api_router.include_router(analytics_assistant_router, prefix="/analytics/assistant", tags=["analytics"])

# ── Marketing Automation ────────────────────────────────────────────────────
api_router.include_router(marketing_campaigns_router, prefix="/marketing")
api_router.include_router(marketing_ai_studio_router, prefix="/marketing")
api_router.include_router(marketing_journeys_router, prefix="/marketing")
api_router.include_router(marketing_reviews_router, prefix="/marketing")
api_router.include_router(marketing_leads_router, prefix="/marketing")
api_router.include_router(marketing_social_router, prefix="/marketing")
api_router.include_router(marketing_landing_pages_router, prefix="/marketing")
api_router.include_router(marketing_dashboard_router, prefix="/marketing")

# ── Super Admin Platform ────────────────────────────────────────────────────
api_router.include_router(admin_dashboard_router, prefix="/admin")
api_router.include_router(admin_tenants_router, prefix="/admin")
api_router.include_router(admin_subscriptions_router, prefix="/admin")
api_router.include_router(admin_billing_router, prefix="/admin")
api_router.include_router(admin_usage_router, prefix="/admin")
api_router.include_router(admin_feature_flags_router, prefix="/admin")
api_router.include_router(admin_support_router, prefix="/admin")
api_router.include_router(admin_monitoring_router, prefix="/admin")
api_router.include_router(admin_security_router, prefix="/admin")

# ── AI Studio & Workflow Builder ────────────────────────────────────────────
from app.ai_studio.routers.agents import router as ai_studio_agents_router
from app.ai_studio.routers.workflows import router as ai_studio_workflows_router
from app.ai_studio.routers.prompts import router as ai_studio_prompts_router
from app.ai_studio.routers.simulator import router as ai_studio_simulator_router
from app.ai_studio.routers.deployments import router as ai_studio_deployments_router

api_router.include_router(ai_studio_agents_router, prefix="/ai-studio")
api_router.include_router(ai_studio_workflows_router, prefix="/ai-studio")
api_router.include_router(ai_studio_prompts_router, prefix="/ai-studio")
api_router.include_router(ai_studio_simulator_router, prefix="/ai-studio")
api_router.include_router(ai_studio_deployments_router, prefix="/ai-studio")

# ── Developer Platform & Marketplace ────────────────────────────────────────
from app.api.v1.endpoints import developer, webhooks, marketplace, public_api

api_router.include_router(developer.router, prefix="/developer", tags=["developer"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(marketplace.router, prefix="/marketplace", tags=["marketplace"])
api_router.include_router(public_api.router, prefix="/public", tags=["public"])
