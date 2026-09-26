export const THEME_SCHEDULE = {
  dayStartHour: 6,
  nightStartHour: 18,
};

const IST_TIME_ZONE = "Asia/Kolkata";

const getIstHour = (date) => {
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;

  return Number(hour);
};

export const getScheduledTheme = (date = new Date()) => {
  const hour = getIstHour(date);
  return hour >= THEME_SCHEDULE.dayStartHour && hour < THEME_SCHEDULE.nightStartHour ? "light" : "dark";
};
