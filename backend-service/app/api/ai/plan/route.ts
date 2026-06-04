import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { from, to, budget, days } = await req.json();

    if (!from || !to || !budget || !days) {
      return NextResponse.json(
        { error: 'Missing from, to, budget, or days parameters' },
        { status: 400, headers }
      );
    }

    // Convert budget and days to numeric
    const numericBudget = parseInt(String(budget).replace(/[^0-9]/g, ''), 10) || 50000;
    const numericDays = parseInt(days, 10) || 5;

    let transportCost = Math.round(numericBudget * 0.3);
    let hotelCost = Math.round(numericBudget * 0.4);
    let foodCost = numericBudget - transportCost - hotelCost;

    // Call our new ML microservice instead of Gemini
    try {
      const mlResponse = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: from,
          destination: to,
          total_budget: numericBudget,
          duration_days: numericDays
        }),
      });

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        
        // Pass the ML response directly to the frontend
        return NextResponse.json({ plan: mlData }, { headers });

      } else {
        console.warn("ML Service returned an error. Using calculated fallback.", await mlResponse.text());
      }
    } catch (mlError) {
      console.warn("Could not connect to ML Service. Using calculated fallback.", mlError);
    }

    // Fallback schema matching the ML response structure
    const mlPlan = {
      origin: from,
      destination: to,
      budget_per_day: Math.round(numericBudget / numericDays),
      transport: transportCost > 500 ? "Flight" : "Train",
      hotel_price_per_night: Math.round(hotelCost / numericDays),
      hotel_name: "Standard Fallback Hotel",
      top_attractions: `Top Site 1 | Top Site 2 | Top Site 3 in ${to}`,
      attraction_ticket_cost: Math.round(numericBudget * 0.1),
      alternative_hotels: ["Fallback Hotel A", "Fallback Hotel B"],
      alternative_attractions: ["Museum | Park", "Temple | River"],
      formatted_report: `[FALLBACK MODE] Travel plan from ${from} to ${to} for ${numericDays} days.`
    };

    return NextResponse.json({ plan: mlPlan }, { headers });

  } catch (error: any) {
    console.error('Error generating ML plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate ML plan' },
      { status: 500, headers }
    );
  }
}
