import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, ForeignKey, Boolean, JSON, Enum, Text, DateTime, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.models.base import Base

class AgentType(str, enum.Enum):
    RECEPTIONIST = "receptionist"
    SCHEDULING = "scheduling"
    BILLING = "billing"
    SUPPORT = "support"
    MARKETING = "marketing"
    CUSTOM = "custom"

class AIAgent(Base):
    __tablename__ = "ai_agents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid, ForeignKey("clients.id", ondelete="CASCADE"), nullable=True, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    agent_type: Mapped[AgentType] = mapped_column(Enum(AgentType), default=AgentType.CUSTOM)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class AIWorkflow(Base):
    __tablename__ = "ai_workflows"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version_tag: Mapped[str] = mapped_column(String(50), default="v1.0")
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Store the visual graph representation (nodes/edges layout coordinates)
    layout_data: Mapped[dict] = mapped_column(JSON, default=dict)


class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    
    node_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., "start", "ai_decision", "send_sms"
    config_data: Mapped[dict] = mapped_column(JSON, default=dict)


class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    workflow_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    
    source_node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflow_nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflow_nodes.id", ondelete="CASCADE"), nullable=False)
    condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # e.g., "if_true", "on_error"


class StudioPromptTemplate(Base):
    __tablename__ = "studio_prompt_templates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    base_system_prompt: Mapped[Text] = mapped_column(Text, nullable=False)
    variables: Mapped[list] = mapped_column(JSON, default=list) # e.g., ["patient_name", "clinic_name"]


class StudioPromptVersion(Base):
    __tablename__ = "studio_prompt_versions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("studio_prompt_templates.id", ondelete="CASCADE"), nullable=False)
    
    version_number: Mapped[int] = mapped_column(default=1)
    content: Mapped[Text] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft") # draft, published, archived
    author_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)


class TestingSession(Base):
    __tablename__ = "testing_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)
    
    scenario_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., "voice", "sms", "chat"
    input_text: Mapped[Text] = mapped_column(Text, nullable=False)
    output_text: Mapped[Text] = mapped_column(Text, nullable=False)
    
    execution_trace: Mapped[dict] = mapped_column(JSON, default=dict) # Records knowledge used, tools called
    latency_ms: Mapped[int] = mapped_column(default=0)
    confidence_score: Mapped[float] = mapped_column(default=0.0)


class DeploymentHistory(Base):
    __tablename__ = "deployment_history"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_agents.id", ondelete="CASCADE"), nullable=False)
    
    environment: Mapped[str] = mapped_column(String(50), nullable=False) # staging, production
    version_tag: Mapped[str] = mapped_column(String(50), nullable=False)
    deployed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50), default="success") # success, failed, rollback
