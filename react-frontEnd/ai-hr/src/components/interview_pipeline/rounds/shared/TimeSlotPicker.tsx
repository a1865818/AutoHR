"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  Globe,
  MapPin,
  Video,
  Phone,
  Users,
  AlertCircle,
  CheckCircle,
  Edit,
  Save,
  X,
} from "lucide-react";

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
  maxCandidates?: number;
  location?: string;
  locationType: "in_person" | "video" | "phone";
  buffer?: number; // minutes between interviews
  notes?: string;
}

export interface ScheduleConfig {
  defaultDuration: number; // minutes
  bufferTime: number; // minutes between interviews
  advanceBooking: number; // days in advance
  timezone: string;
  autoScheduling: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[]; // 0-6 (Sun-Sat)
  timeSlots: TimeSlot[];
  blackoutDates: string[]; // ISO date strings
  recurringAvailability: boolean;
}

interface TimeSlotPickerProps {
  config: ScheduleConfig;
  onConfigChange: (config: ScheduleConfig) => void;
  roundType?: string;
  allowMultipleSlots?: boolean;
  showLocationSettings?: boolean;
  showAdvancedOptions?: boolean;
}

export function TimeSlotPicker({
  config,
  onConfigChange,
  roundType,
  allowMultipleSlots = true,
  showLocationSettings = true,
  showAdvancedOptions = true,
}: TimeSlotPickerProps) {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const timezones = [
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "America/Denver",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  const weekDays = [
    { value: 0, label: "Sunday", short: "Sun" },
    { value: 1, label: "Monday", short: "Mon" },
    { value: 2, label: "Tuesday", short: "Tue" },
    { value: 3, label: "Wednesday", short: "Wed" },
    { value: 4, label: "Thursday", short: "Thu" },
    { value: 5, label: "Friday", short: "Fri" },
    { value: 6, label: "Saturday", short: "Sat" },
  ];

  const locationTypes = [
    {
      value: "video",
      label: "Video Call",
      icon: Video,
      description: "Online meeting",
    },
    {
      value: "in_person",
      label: "In Person",
      icon: MapPin,
      description: "Physical location",
    },
    {
      value: "phone",
      label: "Phone Call",
      icon: Phone,
      description: "Phone interview",
    },
  ];

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 15, 30, 45]) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${timeString}`
        ).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const addTimeSlot = (slot: TimeSlot) => {
    onConfigChange({
      ...config,
      timeSlots: [...config.timeSlots, slot],
    });
    setIsAddingSlot(false);
  };

  const updateTimeSlot = (id: string, updates: Partial<TimeSlot>) => {
    onConfigChange({
      ...config,
      timeSlots: config.timeSlots.map((slot) =>
        slot.id === id ? { ...slot, ...updates } : slot
      ),
    });
    setEditingSlot(null);
  };

  const deleteTimeSlot = (id: string) => {
    onConfigChange({
      ...config,
      timeSlots: config.timeSlots.filter((slot) => slot.id !== id),
    });
  };

  const addBlackoutDate = (date: string) => {
    if (!config.blackoutDates.includes(date)) {
      onConfigChange({
        ...config,
        blackoutDates: [...config.blackoutDates, date],
      });
    }
  };

  const removeBlackoutDate = (date: string) => {
    onConfigChange({
      ...config,
      blackoutDates: config.blackoutDates.filter((d) => d !== date),
    });
  };

  const updateWorkingDays = (dayOfWeek: number, isSelected: boolean) => {
    const workingDays = isSelected
      ? [...config.workingDays, dayOfWeek]
      : config.workingDays.filter((day) => day !== dayOfWeek);

    onConfigChange({
      ...config,
      workingDays: workingDays.sort(),
    });
  };

  const getLocationIcon = (locationType: string) => {
    const type = locationTypes.find((t) => t.value === locationType);
    return type?.icon || MapPin;
  };

  const getDayLabel = (dayOfWeek: number) => {
    return weekDays.find((day) => day.value === dayOfWeek)?.label || "";
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const end = new Date(`2000-01-01T${endTime}`).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Scheduling Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Duration (minutes)
            </label>
            <input
              type="number"
              value={config.defaultDuration}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  defaultDuration: parseInt(e.target.value) || 30,
                })
              }
              min="15"
              max="180"
              step="15"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buffer Time (minutes)
            </label>
            <input
              type="number"
              value={config.bufferTime}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  bufferTime: parseInt(e.target.value) || 15,
                })
              }
              min="0"
              max="60"
              step="5"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advance Booking (days)
            </label>
            <input
              type="number"
              value={config.advanceBooking}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  advanceBooking: parseInt(e.target.value) || 1,
                })
              }
              min="0"
              max="30"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={config.timezone}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  timezone: e.target.value,
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours Start
            </label>
            <select
              value={config.workingHours.start}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  workingHours: {
                    ...config.workingHours,
                    start: e.target.value,
                  },
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {generateTimeOptions()
                .slice(0, 48)
                .map((time) => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours End
            </label>
            <select
              value={config.workingHours.end}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  workingHours: { ...config.workingHours, end: e.target.value },
                })
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {generateTimeOptions()
                .slice(24)
                .map((time) => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="autoScheduling"
            checked={config.autoScheduling}
            onChange={(e) =>
              onConfigChange({
                ...config,
                autoScheduling: e.target.checked,
              })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="autoScheduling"
            className="ml-2 text-sm text-gray-700"
          >
            Enable automatic scheduling
          </label>
        </div>
      </div>

      {/* Working Days */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Working Days
        </h4>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div key={day.value} className="text-center">
              <label className="block">
                <input
                  type="checkbox"
                  checked={config.workingDays.includes(day.value)}
                  onChange={(e) =>
                    updateWorkingDays(day.value, e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`p-2 rounded-lg border-2 cursor-pointer transition-colors ${
                    config.workingDays.includes(day.value)
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-xs font-medium">{day.short}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Time Slots */}
      {allowMultipleSlots && (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">
                Custom Time Slots
              </h4>
              <p className="text-sm text-gray-600">
                Define specific availability windows for this round
              </p>
            </div>

            <button
              onClick={() => setIsAddingSlot(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Time Slot
            </button>
          </div>

          {/* Time Slots List */}
          <div className="space-y-3">
            {config.timeSlots.map((slot) => {
              const LocationIcon = getLocationIcon(slot.locationType);
              const isEditing = editingSlot === slot.id;

              return (
                <div
                  key={slot.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {isEditing ? (
                    <TimeSlotEditor
                      slot={slot}
                      onSave={(updates) => updateTimeSlot(slot.id, updates)}
                      onCancel={() => setEditingSlot(null)}
                      showLocationSettings={showLocationSettings}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <LocationIcon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {getDayLabel(slot.dayOfWeek)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTimeRange(slot.startTime, slot.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Globe className="w-4 h-4" />
                          <span>{slot.timezone}</span>
                        </div>

                        {slot.maxCandidates && (
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Max: {slot.maxCandidates}</span>
                          </div>
                        )}

                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {slot.locationType.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingSlot(slot.id)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTimeSlot(slot.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Time Slot Form */}
          {isAddingSlot && (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 mt-4">
              <TimeSlotEditor
                slot={{
                  id: `slot_${Date.now()}`,
                  dayOfWeek: 1,
                  startTime: config.workingHours.start,
                  endTime: config.workingHours.end,
                  timezone: config.timezone,
                  locationType: "video",
                  buffer: config.bufferTime,
                }}
                onSave={addTimeSlot}
                onCancel={() => setIsAddingSlot(false)}
                showLocationSettings={showLocationSettings}
                isNew={true}
              />
            </div>
          )}

          {config.timeSlots.length === 0 && !isAddingSlot && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No custom time slots defined</p>
              <p className="text-sm">Using general working hours</p>
            </div>
          )}
        </div>
      )}

      {/* Blackout Dates */}
      {showAdvancedOptions && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Blackout Dates
          </h4>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={() => addBlackoutDate(selectedDate)}
              disabled={config.blackoutDates.includes(selectedDate)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Blackout
            </button>
          </div>

          {config.blackoutDates.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Blackout Dates:
              </p>
              <div className="flex flex-wrap gap-2">
                {config.blackoutDates.map((date) => (
                  <div
                    key={date}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(date).toLocaleDateString()}</span>
                    <button
                      onClick={() => removeBlackoutDate(date)}
                      className="ml-1 hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Time Slot Editor Component
interface TimeSlotEditorProps {
  slot: Partial<TimeSlot>;
  onSave: (slot: any) => void;
  onCancel: () => void;
  showLocationSettings: boolean;
  isNew?: boolean;
}

function TimeSlotEditor({
  slot,
  onSave,
  onCancel,
  showLocationSettings,
  isNew = false,
}: TimeSlotEditorProps) {
  const [editedSlot, setEditedSlot] = useState<Partial<TimeSlot>>(slot);

  const weekDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const locationTypes = [
    { value: "video", label: "Video Call" },
    { value: "in_person", label: "In Person" },
    { value: "phone", label: "Phone Call" },
  ];

  const timezones = [
    "America/New_York",
    "America/Los_Angeles",
    "America/Chicago",
    "America/Denver",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 15, 30, 45]) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        const displayTime = new Date(
          `2000-01-01T${timeString}`
        ).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const handleSave = () => {
    if (!editedSlot.startTime || !editedSlot.endTime) return;
    onSave(isNew ? editedSlot : editedSlot);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Day of Week
          </label>
          <select
            value={editedSlot.dayOfWeek ?? 1}
            onChange={(e) =>
              setEditedSlot((prev) => ({
                ...prev,
                dayOfWeek: parseInt(e.target.value),
              }))
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {weekDays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={editedSlot.timezone || "America/New_York"}
            onChange={(e) =>
              setEditedSlot((prev) => ({ ...prev, timezone: e.target.value }))
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <select
            value={editedSlot.startTime || "09:00"}
            onChange={(e) =>
              setEditedSlot((prev) => ({ ...prev, startTime: e.target.value }))
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {generateTimeOptions().map((time) => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <select
            value={editedSlot.endTime || "17:00"}
            onChange={(e) =>
              setEditedSlot((prev) => ({ ...prev, endTime: e.target.value }))
            }
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {generateTimeOptions().map((time) => (
              <option key={time.value} value={time.value}>
                {time.label}
              </option>
            ))}
          </select>
        </div>

        {showLocationSettings && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type
            </label>
            <select
              value={editedSlot.locationType || "video"}
              onChange={(e) =>
                setEditedSlot((prev) => ({
                  ...prev,
                  locationType: e.target.value as TimeSlot["locationType"],
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {locationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Candidates
          </label>
          <input
            type="number"
            value={editedSlot.maxCandidates || ""}
            onChange={(e) =>
              setEditedSlot((prev) => ({
                ...prev,
                maxCandidates: parseInt(e.target.value) || undefined,
              }))
            }
            placeholder="No limit"
            min="1"
            max="10"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {showLocationSettings && editedSlot.locationType === "in_person" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Address
          </label>
          <input
            type="text"
            value={editedSlot.location || ""}
            onChange={(e) =>
              setEditedSlot((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="Enter meeting location..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          value={editedSlot.notes || ""}
          onChange={(e) =>
            setEditedSlot((prev) => ({ ...prev, notes: e.target.value }))
          }
          placeholder="Additional notes for this time slot..."
          rows={2}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!editedSlot.startTime || !editedSlot.endTime}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {isNew ? "Add Time Slot" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
