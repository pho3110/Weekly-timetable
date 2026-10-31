import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { CalendarDays, Sun, Sunset, Plus, MapPin, X, Check } from 'lucide-react';
import { COLORS, DAYS, SLOTS, STORAGE_KEY, loadSchedule } from './storage';
import './styles.css';
import { useDaySwipe } from './useDaySwipe';
import { dismissStartup } from './startup';
import { useCurrentLesson } from './useCurrentLesson';
import { LessonMascot } from './LessonMascot';
import { useSheetGesture } from './useSheetGesture';
import { usePwaUpdates } from './usePwaUpdates';

function outsideDialog(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
}

function App() {
  const [schedule, setSchedule] = useState(loadSchedule);
  const [day, setDay] = useState(Math.min(4, Math.max(0, (new Date().getDay() + 6) % 7)));
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  usePwaUpdates(!!editing, () => setNotice('Chưa thể chuẩn bị offline. Hãy tải lại khi có mạng.'));
  const currentLesson = useCurrentLesson();
  const dialog = useRef(null);
  const backdropPress = useRef(false);
  const { requestClose: closeEditor, ...sheetHandlers } = useSheetGesture(dialog, () => setEditing(null), !!editing);
  const mobileSchedule = useRef(null);
  const previousDay = useRef(day);
  const swipeHandlers = useDaySwipe(direction => setDay(current => Math.max(0, Math.min(DAYS.length - 1, current + direction))));
  useEffect(dismissStartup, []);
  useLayoutEffect(() => {
    const direction = Math.sign(day - previousDay.current);
    previousDay.current = day;
    const element = mobileSchedule.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!direction || !element?.getClientRects().length || motion.matches) return;
    // Animate the existing panel so rapid swipes do not reset touch tracking.
    const animation = element.animate([
      { opacity: 0.6, transform: `translateX(${direction * 12}px)` },
      { opacity: 1, transform: 'translateX(0)' },
    ], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
    const stopForReducedMotion = () => { if (motion.matches) animation.cancel(); };
    motion.addEventListener('change', stopForReducedMotion);
    return () => { animation.cancel(); motion.removeEventListener('change', stopForReducedMotion); };
  }, [day]);
  useEffect(() => {
    if (editing) {
      if (!dialog.current?.open) dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [editing]);
  useEffect(() => {
    if (!editing) return;
    // Keep the body in normal layout while the editor is open; this avoids
    // fixed-body layout changes as iOS brings up the keyboard.
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const prev = { htmlOverflow: htmlEl.style.overflow, bodyOverflow: bodyEl.style.overflow };
    htmlEl.style.overflow = 'hidden';
    bodyEl.style.overflow = 'hidden';
    const viewport = window.visualViewport;
    function fitKeyboard() {
      if (!viewport || !dialog.current) return;
      dialog.current.style.setProperty('--keyboard-bottom', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
      dialog.current.style.setProperty('--sheet-available', `${viewport.height}px`);
    }
    fitKeyboard();
    viewport?.addEventListener('resize', fitKeyboard);
    viewport?.addEventListener('scroll', fitKeyboard);
    return () => {
      viewport?.removeEventListener('resize', fitKeyboard);
      viewport?.removeEventListener('scroll', fitKeyboard);
      htmlEl.style.overflow = prev.htmlOverflow;
      bodyEl.style.overflow = prev.bodyOverflow;
      dialog.current?.style.removeProperty('--keyboard-bottom');
      dialog.current?.style.removeProperty('--sheet-available');
    };
  }, [!!editing]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer); }, [notice]);
  function persist(next) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setSchedule(next); return true; }
    catch { setNotice('Không thể lưu. Bộ nhớ thiết bị có thể đã đầy hoặc bị chặn.'); return false; }
  }
  function edit(d, s) {
    // Mount and focus within the original tap, preserving iOS user activation.
    flushSync(() => setEditing({ day: d, slot: s, subject: '', room: '', color: COLORS[d], ...schedule[`${d}-${s}`] }));
    const element = dialog.current;
    if (!element.open) element.showModal();
    element.querySelector('input[name="subject"]')?.focus({ preventScroll: true });
  }
  function save(event) {
    event.preventDefault(); const key = `${editing.day}-${editing.slot}`;
    if (persist({ ...schedule, [key]: { subject: editing.subject.trim(), room: editing.room.trim(), color: editing.color } })) { closeEditor(); setNotice('Đã lưu ca học trên thiết bị.'); }
  }
  function remove() { const next = { ...schedule }; delete next[`${editing.day}-${editing.slot}`]; if (persist(next)) closeEditor(); }
  function cell(d, s) {
    const item = schedule[`${d}-${s}`];
    const active = !!item && currentLesson === `${d}-${s}`;
    return <button key={`${d}-${s}`} className={`lesson ${item ? item.color : 'empty'}${active ? ' is-current' : ''}`} aria-current={active ? 'time' : undefined} onClick={() => edit(d, s)} aria-label={`${DAYS[d]}, ${SLOTS[s].label}: ${item ? `${item.subject}, phòng ${item.room || 'chưa đặt'}. Chỉnh sửa${active ? '. Đang học' : ''}` : 'Thêm môn học'}`}>
      {active && <LessonMascot/>}
      {item ? <><span className="lesson-marker"/><span className="lesson-name">{item.subject}</span><span className="room"><MapPin size={14}/><span>{item.room || 'Chưa có phòng'}</span></span></> : <><span className="add-icon"><Plus size={18}/></span><span>Thêm môn học</span></>}
    </button>;
  }
  return <div className="app-shell">
    <header className="topbar"><a href="./" className="brand"><span className="brand-icon"><CalendarDays size={21}/></span>Lịch học</a></header>
    <main>
      <section className="schedule-section"><div className="section-toolbar"><div><h2>Thời khóa biểu</h2></div><div className="tools"><button className="primary" aria-label="Thêm ca học" onClick={() => edit(day, SLOTS.findIndex((_, s) => !schedule[`${day}-${s}`]) < 0 ? 0 : SLOTS.findIndex((_, s) => !schedule[`${day}-${s}`]))}><Plus size={17}/><span>Thêm ca học</span></button></div></div>
      <div className="day-tabs" aria-label="Chọn ngày">{DAYS.map((name, d) => <button key={name} aria-pressed={day === d} className={day === d ? 'selected' : ''} onClick={() => setDay(d)}>{name}<span className={`day-dot ${SLOTS.some((_, s) => schedule[`${d}-${s}`]) ? 'has-lessons' : ''}`} aria-hidden="true"/></button>)}</div>
      <div className="desktop-grid"><div className="grid-heading time-heading">CA HỌC</div>{DAYS.map((name, d) => <div key={name} className={`grid-heading ${d === (new Date().getDay() + 6) % 7 ? 'today' : ''}`}>{name}{d === (new Date().getDay() + 6) % 7 && <span>Hôm nay</span>}</div>)}
      {SLOTS.map((slot, s) => <React.Fragment key={s}><div className={`time-cell ${s === 2 ? 'afternoon' : ''}`}><span className="period">{slot.period}</span><strong>{slot.label}</strong><span>{slot.time}</span></div>{DAYS.map((_, d) => <div className={`grid-cell ${s === 2 ? 'afternoon' : ''}`} key={d}>{cell(d, s)}</div>)}</React.Fragment>)}</div>
      <div className="mobile-schedule" ref={mobileSchedule} {...swipeHandlers}>{SLOTS.map((slot, s) => <div className="mobile-slot" key={s}><div className="mobile-time"><span className={`slot-symbol ${s < 2 ? 'morning' : 'afternoon-symbol'}`}>{s < 2 ? <Sun size={17}/> : <Sunset size={17}/>}</span><strong>{slot.label}<span>{slot.period}</span></strong><span className="time-badge">{slot.time}</span></div>{cell(day, s)}</div>)}</div>
      </section>
    </main>
    <dialog ref={dialog} aria-labelledby="lesson-dialog-title" onCancel={event => { event.preventDefault(); closeEditor(); }} onPointerDown={event => { backdropPress.current = event.target === event.currentTarget && outsideDialog(event); }} onClick={event => { if (event.target === event.currentTarget && backdropPress.current && outsideDialog(event)) closeEditor(); backdropPress.current = false; }}>
      <button type="button" className="sheet-handle" aria-label="Đóng chỉnh sửa ca học" {...sheetHandlers}><span/></button>
      <div className="dialog-header"><h2 id="lesson-dialog-title">{schedule[`${editing?.day}-${editing?.slot}`] ? 'Chỉnh sửa ca học' : 'Thêm ca học'}</h2><button className="icon-button" aria-label="Đóng" onClick={closeEditor}><X size={20}/></button></div>
      {editing && <form onSubmit={save}><p className="form-description">{DAYS[editing.day]} · {SLOTS[editing.slot].label} · {SLOTS[editing.slot].time}</p><div className="form-row"><label>Ngày<select value={editing.day} onChange={e => setEditing({ ...editing, day: Number(e.target.value) })}>{DAYS.map((name, d) => <option value={d} key={d}>{name}</option>)}</select></label><label>Ca học<select value={editing.slot} onChange={e => setEditing({ ...editing, slot: Number(e.target.value) })}>{SLOTS.map((slot, s) => <option value={s} key={s}>{slot.label} · {slot.time}</option>)}</select></label></div><label>Tên môn học<input name="subject" inputMode="text" enterKeyHint="next" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.form.elements.room.focus(); } }} required maxLength={100} value={editing.subject} placeholder="Ví dụ: Lập trình web" onChange={e => setEditing({ ...editing, subject: e.target.value })} pattern=".*\S.*"/></label><label>Phòng học<input name="room" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={60} value={editing.room} placeholder="Ví dụ: A.203" onChange={e => setEditing({ ...editing, room: e.target.value })}/></label><fieldset><legend>Màu ca học</legend><div className="color-picker">{COLORS.map((color, i) => <button type="button" key={color} aria-label={['Xanh lá', 'Xanh dương', 'Cam', 'Tím', 'Vàng'][i]} aria-pressed={editing.color === color} className={color} onClick={() => setEditing({ ...editing, color })}>{editing.color === color && <Check size={18}/>}</button>)}</div></fieldset>{schedule[`${editing.day}-${editing.slot}`] && <p className="replace-note">Lưu sẽ cập nhật môn học tại ca đang chọn.</p>}<div className="form-actions">{schedule[`${editing.day}-${editing.slot}`] && <button type="button" className="delete" onClick={remove}>Xóa ca học</button>}<button className="primary" type="submit"><Check size={17}/>Lưu ca học</button></div></form>}
    </dialog>{notice && <div className="toast" role="status">{notice}</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
