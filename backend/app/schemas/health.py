from pydantic import BaseModel, Field

class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Status of the backend application")
    application: str = Field(default="SAARTHII", description="Application name")
    version: str = Field(default="1.0.0", description="Application version")
