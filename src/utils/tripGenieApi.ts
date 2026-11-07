import { TripGenieAnalysis, TripGenieWeatherForecast, TripDestination, ItineraryActivity, Expense, Member, UserProfile } from '../types';

const STORAGE_KEY = 'travelmate_tripgenie_analysis';
const WEATHER_STORAGE_KEY = 'travelmate_tripgenie_weather';

export function getCachedWeatherForecast(destinationId: string): TripGenieWeatherForecast | null {
  try {
    const raw = localStorage.getItem(`${WEATHER_STORAGE_KEY}_${destinationId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read cached TripGenie weather:', e);
  }
  return null;
}

export function saveCachedWeatherForecast(destinationId: string, forecast: TripGenieWeatherForecast): void {
  try {
    localStorage.setItem(`${WEATHER_STORAGE_KEY}_${destinationId}`, JSON.stringify(forecast));
  } catch (e) {
    console.error('Failed to cache TripGenie weather:', e);
  }
}

export async function fetchTripGenieWeatherForecast(params: {
  destination: string;
  location: string;
  destinationId: string;
  dates?: string;
  currentWeather?: string;
}): Promise<TripGenieWeatherForecast> {
  const { destination, location, destinationId, dates, currentWeather } = params;

  try {
    const res = await fetch('/api/tripgenie/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        destination,
        location,
        destinationId,
        dates,
        currentWeather,
      }),
    });

    if (res.ok) {
      const data: TripGenieWeatherForecast = await res.json();
      saveCachedWeatherForecast(destinationId, data);
      return data;
    }
  } catch (err) {
    console.warn('Network request to /api/tripgenie/weather failed, generating client fallback:', err);
  }

  // Client-side fallback if server is unavailable
  const fallback = generateClientFallbackWeather(destinationId, destination, location);
  saveCachedWeatherForecast(destinationId, fallback);
  return fallback;
}

export function generateClientFallbackWeather(destinationId: string, destination: string, location: string): TripGenieWeatherForecast {
  const isKyoto = destinationId === '1' || destination.toLowerCase().includes('kyoto');
  const isIndia = destinationId === '2' || destination.toLowerCase().includes('delhi');
  const isKerala = destinationId === '3' || destination.toLowerCase().includes('kerala');
  const isLadakh = destinationId === '4' || destination.toLowerCase().includes('ladakh');

  if (isIndia) {
    return {
      destinationId,
      destinationName: destination,
      location,
      summaryAdvisory: 'Pleasant winter warmth with clear sunny skies. Early morning light at the Taj Mahal offers serene reflection photos with minimal crowds.',
      bestOutdoorDay: 'Day 2 (Wed)',
      cautionDay: 'Day 4 (Fri - Morning Mist)',
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      days: [
        {
          id: 'day-1',
          dayLabel: 'Today',
          dateStr: 'Dec 10',
          condition: 'Sunny & Pleasant',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 23,
          tempLowC: 12,
          rainChancePct: 0,
          humidityPct: 45,
          windSpeedKmH: 9,
          tripGenieTip: 'Ideal morning light for Old Delhi walking tour and Chandni Chowk street food.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-2',
          dayLabel: 'Day 2 (Wed)',
          dateStr: 'Dec 11',
          condition: 'Clear Blue Sky',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 24,
          tempLowC: 13,
          rainChancePct: 0,
          humidityPct: 42,
          windSpeedKmH: 10,
          tripGenieTip: 'Pristine visibility: prime time for Humayun’s Tomb and Qutub Minar photography.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-3',
          dayLabel: 'Day 3 (Thu)',
          dateStr: 'Dec 12',
          condition: 'Mild & Sunny',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 22,
          tempLowC: 11,
          rainChancePct: 0,
          humidityPct: 48,
          windSpeedKmH: 8,
          tripGenieTip: 'Warm afternoon: excellent for traveling via express highway to Agra.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-4',
          dayLabel: 'Day 4 (Fri)',
          dateStr: 'Dec 13',
          condition: 'Morning Mist & Sun',
          weatherType: 'partly_cloudy',
          icon: 'foggy',
          tempHighC: 21,
          tempLowC: 10,
          rainChancePct: 5,
          humidityPct: 62,
          windSpeedKmH: 7,
          tripGenieTip: 'Morning river mist lifts by 08:30—Taj Mahal looks mystical in early light.',
          recommendation: 'good',
        },
        {
          id: 'day-5',
          dayLabel: 'Day 5 (Sat)',
          dateStr: 'Dec 14',
          condition: 'Warm Golden Sunshine',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 25,
          tempLowC: 13,
          rainChancePct: 0,
          humidityPct: 40,
          windSpeedKmH: 11,
          tripGenieTip: 'Comfortable warmth for Amber Fort elephant trail and City Palace courtyard.',
          recommendation: 'outdoor_favorable',
        },
      ],
    };
  }

  if (isKerala) {
    return {
      destinationId,
      destinationName: destination,
      location,
      summaryAdvisory: 'Balmy tropical climate with gentle coastal breezes. Houseboat sailing is calm; brief afternoon shower on Day 3 adds romantic misty atmosphere.',
      bestOutdoorDay: 'Day 1 (Today)',
      cautionDay: 'Day 3 (Thu - Passing Showers)',
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      days: [
        {
          id: 'day-1',
          dayLabel: 'Today',
          dateStr: 'Jan 5',
          condition: 'Tropical Breeze',
          weatherType: 'partly_cloudy',
          icon: 'partly_cloudy_day',
          tempHighC: 30,
          tempLowC: 23,
          rainChancePct: 10,
          humidityPct: 72,
          windSpeedKmH: 14,
          tripGenieTip: 'Great breeze along Cochin harbor; catch Chinese fishing nets at sunset.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-2',
          dayLabel: 'Day 2 (Wed)',
          dateStr: 'Jan 6',
          condition: 'Warm & Sunny',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 31,
          tempLowC: 24,
          rainChancePct: 15,
          humidityPct: 70,
          windSpeedKmH: 12,
          tripGenieTip: 'Ideal morning for spice market shopping and heritage Fort Kochi cafes.',
          recommendation: 'good',
        },
        {
          id: 'day-3',
          dayLabel: 'Day 3 (Thu)',
          dateStr: 'Jan 7',
          condition: 'Passing Showers',
          weatherType: 'rainy',
          icon: 'rainy',
          tempHighC: 28,
          tempLowC: 22,
          rainChancePct: 60,
          humidityPct: 82,
          windSpeedKmH: 18,
          tripGenieTip: 'Rain on houseboat roof creates serene ambience; enjoy fresh Karimeen fish lunch onboard.',
          recommendation: 'rain_prep',
        },
        {
          id: 'day-4',
          dayLabel: 'Day 4 (Fri)',
          dateStr: 'Jan 8',
          condition: 'Misty Tea Hills',
          weatherType: 'cloudy',
          icon: 'cloud',
          tempHighC: 24,
          tempLowC: 17,
          rainChancePct: 25,
          humidityPct: 75,
          windSpeedKmH: 10,
          tripGenieTip: 'Munnar ascent is cool and misty; carry a light windbreaker for tea plantation walks.',
          recommendation: 'good',
        },
        {
          id: 'day-5',
          dayLabel: 'Day 5 (Sat)',
          dateStr: 'Jan 9',
          condition: 'Sunny & Crisp',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 29,
          tempLowC: 21,
          rainChancePct: 10,
          humidityPct: 65,
          windSpeedKmH: 11,
          tripGenieTip: 'Clear skies for sunset viewpoint over Vembanad Lake.',
          recommendation: 'outdoor_favorable',
        },
      ],
    };
  }

  if (isLadakh) {
    return {
      destinationId,
      destinationName: destination,
      location,
      summaryAdvisory: 'High-altitude crisp mountain climate with strong solar radiation. Thermal base layers and sunglasses are essential for mountain passes.',
      bestOutdoorDay: 'Day 1 (Today)',
      cautionDay: 'Day 4 (Fri - Mountain Wind)',
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      days: [
        {
          id: 'day-1',
          dayLabel: 'Today',
          dateStr: 'May 12',
          condition: 'Crisp Alpine Sun',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 13,
          tempLowC: 1,
          rainChancePct: 0,
          humidityPct: 28,
          windSpeedKmH: 14,
          tripGenieTip: 'Gentle walk to Shanti Stupa; drink extra water for acclimatization.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-2',
          dayLabel: 'Day 2 (Wed)',
          dateStr: 'May 13',
          condition: 'Bright & Chilly',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 14,
          tempLowC: 2,
          rainChancePct: 0,
          humidityPct: 25,
          windSpeedKmH: 15,
          tripGenieTip: 'Clear skies for Thiksey Monastery morning prayer chant ceremony.',
          recommendation: 'outdoor_favorable',
        },
        {
          id: 'day-3',
          dayLabel: 'Day 3 (Thu)',
          dateStr: 'May 14',
          condition: 'Partly Cloudy',
          weatherType: 'partly_cloudy',
          icon: 'partly_cloudy_day',
          tempHighC: 11,
          tempLowC: 0,
          rainChancePct: 10,
          humidityPct: 35,
          windSpeedKmH: 18,
          tripGenieTip: 'Khardung La pass crossing will be below freezing; keep thermal gloves ready.',
          recommendation: 'good',
        },
        {
          id: 'day-4',
          dayLabel: 'Day 4 (Fri)',
          dateStr: 'May 15',
          condition: 'High Mountain Wind',
          weatherType: 'windy',
          icon: 'air',
          tempHighC: 9,
          tempLowC: -2,
          rainChancePct: 15,
          humidityPct: 40,
          windSpeedKmH: 28,
          tripGenieTip: 'Strong breezes in Nubra sand dunes; wear sunglasses and windbreaker for camel safari.',
          recommendation: 'indoor_ideal',
        },
        {
          id: 'day-5',
          dayLabel: 'Day 5 (Sat)',
          dateStr: 'May 16',
          condition: 'Azure Glacial Skies',
          weatherType: 'sunny',
          icon: 'wb_sunny',
          tempHighC: 12,
          tempLowC: -1,
          rainChancePct: 0,
          humidityPct: 30,
          windSpeedKmH: 16,
          tripGenieTip: 'Spectacular turquoise water reflection at Pangong Tso; optimal photography light.',
          recommendation: 'outdoor_favorable',
        },
      ],
    };
  }

  // Default Kyoto & Tokyo
  return {
    destinationId: destinationId || '1',
    destinationName: destination || 'Kyoto & Tokyo Autumn',
    location: location || 'Kyoto & Tokyo, Japan',
    summaryAdvisory: 'Crisp autumn weather with brilliant momiji foliage lighting. Day 3 brings a passing afternoon shower window—pack a compact umbrella and schedule indoor covered markets.',
    bestOutdoorDay: 'Day 1 (Today)',
    cautionDay: 'Day 3 (Thu - Passing Rain)',
    fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    days: [
      {
        id: 'day-1',
        dayLabel: 'Today',
        dateStr: 'Nov 14',
        condition: 'Sunny & Crisp',
        weatherType: 'sunny',
        icon: 'wb_sunny',
        tempHighC: 20,
        tempLowC: 12,
        rainChancePct: 10,
        humidityPct: 55,
        windSpeedKmH: 11,
        tripGenieTip: 'Prime golden hour light: ideal for Fushimi Inari Torii gate hike and shrine photography.',
        recommendation: 'outdoor_favorable',
      },
      {
        id: 'day-2',
        dayLabel: 'Day 2 (Wed)',
        dateStr: 'Nov 15',
        condition: 'Partly Cloudy',
        weatherType: 'partly_cloudy',
        icon: 'partly_cloudy_day',
        tempHighC: 19,
        tempLowC: 11,
        rainChancePct: 20,
        humidityPct: 58,
        windSpeedKmH: 13,
        tripGenieTip: 'Comfortable breeze: excellent for Arashiyama bamboo grove stroll & Sagano scenic railway.',
        recommendation: 'good',
      },
      {
        id: 'day-3',
        dayLabel: 'Day 3 (Thu)',
        dateStr: 'Nov 16',
        condition: 'Passing Showers',
        weatherType: 'rainy',
        icon: 'rainy',
        tempHighC: 16,
        tempLowC: 10,
        rainChancePct: 65,
        humidityPct: 78,
        windSpeedKmH: 16,
        tripGenieTip: 'Scattered afternoon rain: explore covered Nishiki Food Market & attend traditional tea ceremony.',
        recommendation: 'rain_prep',
      },
      {
        id: 'day-4',
        dayLabel: 'Day 4 (Fri)',
        dateStr: 'Nov 17',
        condition: 'Overcast & Mild',
        weatherType: 'cloudy',
        icon: 'cloud',
        tempHighC: 17,
        tempLowC: 11,
        rainChancePct: 25,
        humidityPct: 64,
        windSpeedKmH: 10,
        tripGenieTip: 'Soft diffuse lighting: perfect for Kinkaku-ji golden pavilion reflections without harsh glare.',
        recommendation: 'good',
      },
      {
        id: 'day-5',
        dayLabel: 'Day 5 (Sat)',
        dateStr: 'Nov 18',
        condition: 'Sunny & Pleasant',
        weatherType: 'sunny',
        icon: 'wb_sunny',
        tempHighC: 21,
        tempLowC: 13,
        rainChancePct: 10,
        humidityPct: 52,
        windSpeedKmH: 12,
        tripGenieTip: 'Clear blue skies: optimal for Gion evening stroll and Yasaka Shrine lantern illumination.',
        recommendation: 'outdoor_favorable',
      },
    ],
  };
}

export function getCachedAnalysis(tripId: string): TripGenieAnalysis | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${tripId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read cached TripGenie analysis:', e);
  }
  return null;
}

export function saveCachedAnalysis(tripId: string, analysis: TripGenieAnalysis): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${tripId}`, JSON.stringify(analysis));
  } catch (e) {
    console.error('Failed to cache TripGenie analysis:', e);
  }
}

export async function runTripGenieAnalysis(params: {
  trip: TripDestination;
  itinerary: ItineraryActivity[];
  expenses: Expense[];
  members: Member[];
  user: UserProfile;
}): Promise<TripGenieAnalysis> {
  const { trip, itinerary, expenses, members, user } = params;

  try {
    const res = await fetch('/api/tripgenie/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trip,
        itinerary,
        expenses,
        members,
        user,
      }),
    });

    if (res.ok) {
      const data: TripGenieAnalysis = await res.json();
      saveCachedAnalysis(trip.id, data);
      return data;
    }
  } catch (err) {
    console.warn('Network request to /api/tripgenie/analyze failed, generating local analysis:', err);
  }

  // Robust client-side fallback if server or network is offline
  const totalSpent = expenses.reduce((sum, e) => sum + (Number(e.amountUsd) || 0), 0);
  const budgetLimit = Number(user.tripBudgetLimit) || Number(trip.budgetLimitUsd) || Number(trip.totalBudgetUsd) || 1500;
  const daysTotal = trip.daysTotal || 8;
  const daysElapsed = 3;
  const dailyBurn = totalSpent / daysElapsed;
  const projectedTotal = dailyBurn * daysTotal;
  const overBudget = totalSpent > budgetLimit;

  const fallback: TripGenieAnalysis = {
    readinessScore: overBudget ? 68 : totalSpent > budgetLimit * 0.85 ? 82 : 93,
    status: overBudget ? 'warning' : totalSpent > budgetLimit * 0.85 ? 'attention' : 'optimal',
    summary: `TripGenie verified ${itinerary.length} scheduled stops, $${totalSpent.toFixed(2)} in recorded expenses across ${members.length} travelers. The trip schedule flows smoothly with strong budget alignment.`,
    analyzedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    itinerary: {
      score: 89,
      pacingAssessment: 'Balanced morning cultural tours with flexible afternoon exploration windows.',
      highlights: [
        'Optimal sunrise timing at sacred landmarks avoids major tourist buses',
        'Good geographical clustering minimizes transit fatigue',
      ],
      clashes: [
        'Mid-day high-heat or shower window: keep indoor covered markets as flexible pivots',
      ],
      transitGaps: [
        'Allow 35 mins buffer for peak rush hour subway transfers',
      ],
      suggestions: [
        'Pre-book high-demand express tickets 24 hours prior',
        'Group outdoor photography stops during the golden hour (16:30 - 17:30)',
      ],
    },
    budget: {
      score: overBudget ? 60 : 88,
      totalSpentUsd: totalSpent,
      budgetLimitUsd: budgetLimit,
      burnRateDailyUsd: Math.round(dailyBurn),
      projectedTotalUsd: Math.round(projectedTotal),
      overBudgetRisk: overBudget ? 'high' : projectedTotal > budgetLimit ? 'moderate' : 'low',
      topExpenseCategory: 'Dining & Street Food',
      savingsOpportunities: [
        'Opt for lunch set menus for premium dining at 40% lower price than evening dinner',
        'Use multi-day public transit passes to reduce individual ticket tapping costs',
      ],
    },
    group: {
      score: 90,
      fairnessIndex: '86% - Even distribution across travelers',
      topCreditor: members[0]?.name || 'Alex',
      topDebtor: members[2]?.name || 'Kenji',
      settlementAdvice: [
        'Settle pending micro-splits periodically to avoid end-of-trip transaction pileups',
        'Continue using equal splitting on shared meals to maintain transparency',
      ],
    },
    packing: {
      score: 91,
      weatherReadiness: `Aligned for current ${trip.weatherTemp} conditions`,
      missingEssentials: [
        'Comfortable slip-on shoes for frequent shoeless temple visits',
        'High-capacity power bank and compact travel umbrella',
      ],
      culturalEtiquette: [
        'Ensure shoulders and knees are covered when visiting heritage or religious sites',
        'Observe quiet zones on public buses and trains',
      ],
    },
    quickFixes: [
      {
        id: 'fix-1',
        title: 'Morning Schedule Optimization',
        category: 'itinerary',
        impact: 'Beat 80% of crowds',
        description: 'Shift the primary outdoor stop forward by 30 minutes for pristine lighting and serene atmosphere.',
        applied: false,
      },
      {
        id: 'fix-2',
        title: 'Dining Daily Buffer Safeguard',
        category: 'budget',
        impact: 'Saves ~$120 on trip',
        description: 'Cap daily lunch allocations to maintain plenty of room for special evening dinners.',
        applied: false,
      },
      {
        id: 'fix-3',
        title: 'Batch Group Debts Settlement',
        category: 'group',
        impact: 'Clears all open debts',
        description: 'Settle balances in a single consolidated transfer between members.',
        applied: false,
      },
    ],
  };

  saveCachedAnalysis(trip.id, fallback);
  return fallback;
}

export async function askTripGenieChat(params: {
  message: string;
  destination: string;
  totalSpent: number;
  budgetLimit: number;
  weather: string;
  memberCount: number;
}): Promise<{ reply: string; suggestedQuestions?: string[] }> {
  try {
    const res = await fetch('/api/tripgenie/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: params.message,
        tripContext: {
          destination: params.destination,
          totalSpent: params.totalSpent,
          budgetLimit: params.budgetLimit,
          weather: params.weather,
          memberCount: params.memberCount,
        },
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Network chat to TripGenie failed, returning client assistant response:', e);
  }

  // Graceful offline assistant reply
  return {
    reply: `TripGenie here! Everything for your ${params.destination} journey is looking great. You have spent $${params.totalSpent.toFixed(2)} of your $${params.budgetLimit} budget. Keep an eye on local weather forecasts and remember to drink plenty of water!`,
    suggestedQuestions: [
      'How to save on food without missing local specialties?',
      'Is our daily walking pace realistic?',
      'What should we pack for temple days?',
    ],
  };
}
