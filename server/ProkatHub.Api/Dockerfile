# syntax=docker/dockerfile:1
# Build context: ./server

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS sdk
WORKDIR /src
COPY ProkatHub.Api/ProkatHub.Api.csproj ProkatHub.Api/
RUN dotnet restore ProkatHub.Api/ProkatHub.Api.csproj
COPY ProkatHub.Api/ ProkatHub.Api/

# Development: run with `docker compose watch`; Compose syncs source changes and dotnet watch reloads them.
FROM sdk AS dev
WORKDIR /src/ProkatHub.Api
ENV ASPNETCORE_HTTP_PORTS=8080 \
    DOTNET_WATCH_RESTART_ON_RUDE_EDIT=true \
    DOTNET_WATCH_SUPPRESS_LAUNCH_BROWSER=true
EXPOSE 8080
ENTRYPOINT ["dotnet", "watch", "run", "--no-launch-profile", "--non-interactive"]

FROM sdk AS build
RUN dotnet publish ProkatHub.Api/ProkatHub.Api.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# Production-like image: ASP.NET runtime only, non-root user.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "ProkatHub.Api.dll"]
