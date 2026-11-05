# Idempotently provisions the local Bugsink (docker-compose.yml) for this app:
# one team, a project per app, the superuser as admin of both. Prints one
# `<slug>=<dsn>` line per project, which scripts/setup.ts writes into .env.
#
# Run inside the container — `pnpm setup` does this for you:
#   docker compose exec -T bugsink bugsink-manage shell < scripts/bugsink-provision.py
#
# Bugsink's REST API needs a token that can only be created in its UI, so this
# uses its Django models directly (verified against bugsink/bugsink:2.6.2).
from django.contrib.auth import get_user_model
from projects.models import Project, ProjectMembership, ProjectRole
from teams.models import Team, TeamMembership, TeamRole

TEAM = "Example App"
PROJECTS = {
    "example-app-web": "Example App (web)",
    "example-app-mobile": "Example App (mobile)",
}

team, _ = Team.objects.get_or_create(name=TEAM)
admins = list(get_user_model().objects.filter(is_superuser=True))
for user in admins:
    TeamMembership.objects.get_or_create(
        team=team, user=user, defaults={"role": TeamRole.ADMIN, "accepted": True}
    )

for slug, name in PROJECTS.items():
    project, _ = Project.objects.get_or_create(
        slug=slug, defaults={"name": name, "team": team}
    )
    for user in admins:
        ProjectMembership.objects.get_or_create(
            project=project,
            user=user,
            defaults={"role": ProjectRole.ADMIN, "accepted": True},
        )
    print(f"{slug}={project.dsn}")
