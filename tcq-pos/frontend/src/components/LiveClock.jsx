import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const day = dayNames[now.getDay()];
  const date = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="live-clock">
      <div className="clock-date">{day} {date}</div>
      <div className="clock-time">{time}</div>
    </div>
  );
}
