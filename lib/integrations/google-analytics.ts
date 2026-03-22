// Google Analytics 4 Data API integration

export async function getGa4Report(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
        ],
        limit: 100,
      }),
    }
  );
  return res.json();
}

export async function getGa4PageViews(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "activeUsers" },
          { name: "averageSessionDuration" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 25,
      }),
    }
  );
  return res.json();
}

export async function getGa4Properties(accessToken: string) {
  const res = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:accounts/-",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.json();
}

export async function getGa4Realtime(accessToken: string, propertyId: string) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dimensions: [{ name: "unifiedScreenName" }],
        metrics: [{ name: "activeUsers" }],
      }),
    }
  );
  return res.json();
}
