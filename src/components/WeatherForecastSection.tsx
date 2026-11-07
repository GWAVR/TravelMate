import React, { useState, useEffect } from 'react';
import { TripDestination, TripGenieWeatherForecast, WeatherForecastDay, ScreenTab } from '../types';
import { fetchTripGenieWeatherForecast, getCachedWeatherForecast, generateClientFallbackWeather } from '../utils/tripGenieApi';

interface WeatherForecastSectionProps {
  trip: TripDestination;
  onNavigate?: (tab: ScreenTab) => void;
  onShowToast?: (msg: string) => void;
}

export const WeatherForecastSection: React.FC<WeatherForecastSectionProps> = ({
  trip,
  onNavigate,
  onShowToast,
}) => {
  const [forecast, setForecast] = useState<TripGenieWeatherForecast>(() => {
    const cached = getCachedWeatherForecast(trip.id);
    if (cached && cached.destinationId === trip.id && Array.isArray(cached.days) && cached.days.length > 0) {
      return cached;
    }
    return generateClientFallbackWeather(trip.id, trip.name, trip.location);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [selectedDayId, setSelectedDayId] = useState<string>('day-1');

  // Load forecast on destination change or mount
  useEffect(() => {
    let isMounted = true;
    const cached = getCachedWeatherForecast(trip.id);
    if (cached && cached.destinationId === trip.id && Array.isArray(cached.days) && cached.days.length > 0) {
      setForecast(cached);
    } else {
      setForecast(generateClientFallbackWeather(trip.id, trip.name, trip.location));
    }

    // Refresh in background or if no cache
    const loadData = async () => {
      if (!cached || cached.destinationId !== trip.id) {
        setIsLoading(true);
      }
      try {
        const data = await fetchTripGenieWeatherForecast({
          destination: trip.name,
          location: trip.location,
          destinationId: trip.id,
          dates: trip.dates,
          currentWeather: `${trip.weatherTemp} ${trip.weatherCondition}`,
        });
        if (isMounted && data && Array.isArray(data.days) && data.days.length > 0) {
          setForecast(data);
          setSelectedDayId(data.days[0].id);
        }
      } catch (err) {
        console.error('Failed to load TripGenie weather:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [trip.id, trip.name, trip.location, trip.dates, trip.weatherTemp, trip.weatherCondition]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTripGenieWeatherForecast({
        destination: trip.name,
        location: trip.location,
        destinationId: trip.id,
        dates: trip.dates,
        currentWeather: `${trip.weatherTemp} ${trip.weatherCondition}`,
      });
      setForecast(data);
      if (onShowToast) {
        onShowToast(`TripGenie weather forecast refreshed for ${trip.shortName}!`);
      }
    } catch (e) {
      if (onShowToast) {
        onShowToast('Could not refresh weather forecast.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const convertTemp = (tempC: number) => {
    if (tempUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${tempC}°C`;
  };

  const getWeatherIconTheme = (weatherType: string, icon: string) => {
    switch (weatherType) {
      case 'sunny':
        return {
          icon: icon || 'wb_sunny',
          iconColor: 'text-amber-500',
          bgColor: 'bg-gradient-to-br from-amber-100 to-amber-50',
          borderColor: 'border-amber-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
          badgeText: 'Sunny',
          badgeBg: 'bg-amber-100 text-amber-800',
        };
      case 'partly_cloudy':
        return {
          icon: icon || 'partly_cloudy_day',
          iconColor: 'text-sky-600',
          bgColor: 'bg-gradient-to-br from-sky-100 to-sky-50',
          borderColor: 'border-sky-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(2,132,199,0.2)]',
          badgeText: 'Partly Cloudy',
          badgeBg: 'bg-sky-100 text-sky-800',
        };
      case 'rainy':
        return {
          icon: icon || 'rainy',
          iconColor: 'text-blue-600',
          bgColor: 'bg-gradient-to-br from-blue-100 to-indigo-50',
          borderColor: 'border-blue-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(37,99,235,0.2)]',
          badgeText: 'Showers',
          badgeBg: 'bg-blue-100 text-blue-800',
        };
      case 'thunderstorm':
        return {
          icon: icon || 'thunderstorm',
          iconColor: 'text-purple-600',
          bgColor: 'bg-gradient-to-br from-purple-100 to-indigo-50',
          borderColor: 'border-purple-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(147,51,234,0.25)]',
          badgeText: 'Thunderstorm',
          badgeBg: 'bg-purple-100 text-purple-800',
        };
      case 'snowy':
        return {
          icon: icon || 'ac_unit',
          iconColor: 'text-cyan-600',
          bgColor: 'bg-gradient-to-br from-cyan-100 to-sky-50',
          borderColor: 'border-cyan-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(8,145,178,0.2)]',
          badgeText: 'Snow / Cold',
          badgeBg: 'bg-cyan-100 text-cyan-800',
        };
      case 'windy':
        return {
          icon: icon || 'air',
          iconColor: 'text-teal-600',
          bgColor: 'bg-gradient-to-br from-teal-100 to-emerald-50',
          borderColor: 'border-teal-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(13,148,136,0.2)]',
          badgeText: 'Windy',
          badgeBg: 'bg-teal-100 text-teal-800',
        };
      case 'cloudy':
      default:
        return {
          icon: icon || 'cloud',
          iconColor: 'text-slate-600',
          bgColor: 'bg-gradient-to-br from-slate-100 to-gray-50',
          borderColor: 'border-slate-200/80',
          glowColor: 'shadow-[0_0_12px_rgba(100,116,139,0.15)]',
          badgeText: 'Cloudy',
          badgeBg: 'bg-slate-100 text-slate-800',
        };
    }
  };

  const getRecommendationBadge = (rec: WeatherForecastDay['recommendation']) => {
    switch (rec) {
      case 'outdoor_favorable':
        return {
          label: 'Outdoor Favorable',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'rain_prep':
        return {
          label: 'Carry Umbrella',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'indoor_ideal':
        return {
          label: 'Indoor Preferred',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'good':
      default:
        return {
          label: 'Good Pacing',
          className: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
        };
    }
  };

  const selectedDay = forecast?.days?.find((d) => d.id === selectedDayId) || forecast?.days?.[0];

  return (
    <section
      id="weather-forecast-section"
      className="w-full bg-white rounded-2xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.06)] flex flex-col gap-3.5 border border-[#e2e8f0]/60 transition-all"
    >
      {/* Header with Title, TripGenie Pill, & Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#e0f2fe] text-[#006194] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">wb_twilight</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm font-bold text-[#131b2e] leading-tight truncate">
                Weather Forecast
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#006194] text-[9px] font-extrabold uppercase tracking-wider border border-[#bae6fd] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-[#006194]">psychology</span>
                TripGenie 5-Day
              </span>
            </div>
            <p className="text-[11px] text-[#64748b] truncate">
              {trip.name} • {(trip.location || trip.name || '').split(',')[0]}
            </p>
          </div>
        </div>

        {/* Controls: °C/°F Toggle and Refresh button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 bg-[#f1f5f9] rounded-lg border border-[#e2e8f0] text-xs font-semibold">
            <button
              onClick={() => setTempUnit('C')}
              className={`px-2 py-1 rounded-md transition-all text-[11px] font-bold ${
                tempUnit === 'C'
                  ? 'bg-white text-[#006194] shadow-xs'
                  : 'text-[#64748b] hover:text-[#131b2e]'
              }`}
              type="button"
              title="Celsius"
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit('F')}
              className={`px-2 py-1 rounded-md transition-all text-[11px] font-bold ${
                tempUnit === 'F'
                  ? 'bg-white text-[#006194] shadow-xs'
                  : 'text-[#64748b] hover:text-[#131b2e]'
              }`}
              type="button"
              title="Fahrenheit"
            >
              °F
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className={`w-8 h-8 rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:text-[#006194] hover:bg-[#f8fafc] active:scale-95 transition-all shadow-xs ${
              isLoading ? 'cursor-not-allowed opacity-60' : ''
            }`}
            title="Refresh weather with TripGenie AI"
            type="button"
          >
            <span
              className={`material-symbols-outlined text-[17px] ${
                isLoading ? 'animate-spin text-[#006194]' : ''
              }`}
            >
              sync
            </span>
          </button>
        </div>
      </div>

      {/* TripGenie Climate Advisory Callout */}
      {forecast && (
        <div className="w-full bg-gradient-to-r from-[#f0f7ff] via-[#f5f9ff] to-[#eef6fc] p-3 rounded-xl border border-[#bae6fd]/60 flex flex-col gap-2">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#006194] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#006194] flex items-center gap-1">
                  TripGenie Climate Advisory
                </span>
                {forecast.fetchedAt && (
                  <span className="text-[10px] text-[#64748b]">Updated {forecast.fetchedAt}</span>
                )}
              </div>
              <p className="text-xs text-[#334155] leading-relaxed mt-0.5">
                {forecast.summaryAdvisory}
              </p>
            </div>
          </div>

          {/* Quick indicators: Best Outdoor Day & Caution Day */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#e0f2fe]/80 flex-wrap">
            {forecast.bestOutdoorDay && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-semibold">
                <span className="material-symbols-outlined text-[13px] text-emerald-600">star</span>
                Best Outdoor: {forecast.bestOutdoorDay}
              </span>
            )}
            {forecast.cautionDay && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[10px] font-semibold">
                <span className="material-symbols-outlined text-[13px] text-amber-600">umbrella</span>
                Weather Watch: {forecast.cautionDay}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 5-Day Forecast Horizontal Cards Grid */}
      <div className="w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {forecast?.days?.map((day, idx) => {
            const theme = getWeatherIconTheme(day.weatherType, day.icon);
            const isSelected = selectedDay?.id === day.id;
            const rec = getRecommendationBadge(day.recommendation);

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                type="button"
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'border-[#006194] bg-[#f0f8ff] ring-2 ring-[#006194]/20 shadow-sm'
                    : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#fafafa]'
                }`}
              >
                {/* Today Pill */}
                {idx === 0 && (
                  <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded bg-[#006194] text-white text-[9px] font-bold uppercase tracking-wider">
                    Today
                  </span>
                )}

                {/* Day Header */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-[#131b2e] leading-tight truncate">
                    {(day.dayLabel || 'Day').split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-medium">{day.dateStr || ''}</span>
                </div>

                {/* Summary Icon (Prominent visual display) */}
                <div className="flex items-center justify-center my-2">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-transform ${theme.bgColor} ${theme.borderColor} ${theme.glowColor} ${
                      isSelected ? 'scale-105' : ''
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[24px] ${theme.iconColor}`}
                      title={day.condition}
                    >
                      {theme.icon}
                    </span>
                  </div>
                </div>

                {/* Condition text */}
                <span
                  className="text-[11px] font-semibold text-[#131b2e] truncate text-center w-full"
                  title={day.condition}
                >
                  {day.condition}
                </span>

                {/* High / Low Temp */}
                <div className="flex items-center justify-center gap-1.5 mt-1 text-center w-full">
                  <span className="text-xs font-extrabold text-[#131b2e]">
                    {convertTemp(day.tempHighC)}
                  </span>
                  <span className="text-[11px] text-[#94a3b8] font-medium">
                    {convertTemp(day.tempLowC)}
                  </span>
                </div>

                {/* Rain Probability indicator */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] text-[#64748b]">
                  <span
                    className={`material-symbols-outlined text-[13px] ${
                      day.rainChancePct > 40 ? 'text-blue-500' : 'text-[#94a3b8]'
                    }`}
                  >
                    water_drop
                  </span>
                  <span
                    className={`font-semibold ${
                      day.rainChancePct > 40
                        ? 'text-blue-600'
                        : day.rainChancePct > 20
                        ? 'text-amber-600'
                        : 'text-[#64748b]'
                    }`}
                  >
                    {day.rainChancePct}% rain
                  </span>
                </div>

                {/* Suitability Chip */}
                <div className="mt-2 w-full pt-1.5 border-t border-[#f1f5f9] flex items-center justify-center">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-1 truncate ${rec.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${rec.dot}`} />
                    {rec.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Deep Dive Drawer / Details */}
      {selectedDay && (
        <div className="w-full bg-[#f8fafc] rounded-xl p-3 border border-[#e2e8f0]/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#131b2e]">
                {selectedDay.dayLabel} ({selectedDay.dateStr}) Detail
              </span>
              <span className="text-[11px] text-[#64748b]">
                {selectedDay.condition} • High {convertTemp(selectedDay.tempHighC)} / Low{' '}
                {convertTemp(selectedDay.tempLowC)}
              </span>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('tripgenie')}
                className="text-xs text-[#006194] font-bold hover:underline flex items-center gap-0.5"
                type="button"
              >
                <span>Ask Genie</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Micro metrics row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-white border border-[#e2e8f0]/70 flex flex-col">
              <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-blue-500">water_drop</span>
                Precipitation
              </span>
              <span className="text-xs font-bold text-[#131b2e] mt-0.5">
                {selectedDay.rainChancePct}% chance
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-[#e2e8f0]/70 flex flex-col">
              <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-cyan-500">humidity_percentage</span>
                Humidity
              </span>
              <span className="text-xs font-bold text-[#131b2e] mt-0.5">
                {selectedDay.humidityPct || 55}%
              </span>
            </div>

            <div className="p-2 rounded-lg bg-white border border-[#e2e8f0]/70 flex flex-col">
              <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-teal-500">air</span>
                Wind
              </span>
              <span className="text-xs font-bold text-[#131b2e] mt-0.5">
                {selectedDay.windSpeedKmH || 12} km/h
              </span>
            </div>
          </div>

          {/* TripGenie Activity Tip */}
          <div className="flex items-start gap-2 pt-1 border-t border-[#e2e8f0]/60">
            <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">
              lightbulb
            </span>
            <p className="text-xs text-[#334155] leading-relaxed">
              <strong className="text-[#006194]">TripGenie Tip:</strong> {selectedDay.tripGenieTip}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
