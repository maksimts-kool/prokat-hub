# syntax=docker/dockerfile:1
# Build context: ./server
# Runs the xUnit tests in a container, so they need only Docker: docker compose run --rm tests

FROM mcr.microsoft.com/dotnet/sdk:10.0
WORKDIR /src
COPY ProkatHub.Api/ProkatHub.Api.csproj ProkatHub.Api/
COPY ProkatHub.Worker/ProkatHub.Worker.csproj ProkatHub.Worker/
COPY ProkatHub.Tests/ProkatHub.Tests.csproj ProkatHub.Tests/
RUN dotnet restore ProkatHub.Tests/ProkatHub.Tests.csproj
COPY . .
RUN dotnet build ProkatHub.Tests/ProkatHub.Tests.csproj --no-restore
ENTRYPOINT ["dotnet", "test", "ProkatHub.Tests/ProkatHub.Tests.csproj", "--no-build"]
