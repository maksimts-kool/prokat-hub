# syntax=docker/dockerfile:1
# Build context: ./server
# Only the Worker project is copied: it talks to the API over HTTP and does not reference it.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ProkatHub.Worker/ProkatHub.Worker.csproj ProkatHub.Worker/
RUN dotnet restore ProkatHub.Worker/ProkatHub.Worker.csproj
COPY ProkatHub.Worker/ ProkatHub.Worker/
RUN dotnet publish ProkatHub.Worker/ProkatHub.Worker.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

# .NET runtime only (no ASP.NET), non-root user.
FROM mcr.microsoft.com/dotnet/runtime:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "ProkatHub.Worker.dll"]
