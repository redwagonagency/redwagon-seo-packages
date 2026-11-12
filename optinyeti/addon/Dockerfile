# OptinYeti lead-capture add-on, layered on top of the existing compiled app.
# The original app DLL is not modified; the add-on is loaded as a hosting startup assembly.
ARG BASE_IMAGE=notification-app:final-snapshot
FROM ${BASE_IMAGE} AS base

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY --from=base /app/Microsoft.Data.Sqlite.dll /app/SQLitePCLRaw.core.dll lib/
COPY OptinYeti.Leads.csproj LeadsAddon.cs ./
RUN dotnet publish OptinYeti.Leads.csproj -c Release -o /out

FROM python:3.12-alpine AS js
WORKDIR /work
COPY --from=base /app/wwwroot/js/popup-engine.js popup-engine.js
COPY patch_engine.py .
RUN python patch_engine.py popup-engine.js

FROM base
COPY --from=build /out/OptinYeti.Leads.dll /app/OptinYeti.Leads.dll
COPY --from=js /work/popup-engine.js /app/wwwroot/js/popup-engine.js
ENV DOTNET_STARTUP_HOOKS=/app/OptinYeti.Leads.dll
ENV ASPNETCORE_HOSTINGSTARTUPASSEMBLIES=OptinYeti.Leads
