import { Award } from 'lucide-react';
import { AchievementDef } from '../game/achievements';

export interface ActiveToast {
  instanceId: number;
  achievement: AchievementDef;
}

interface AchievementToastProps {
  toasts: ActiveToast[];
}

export function AchievementIcon({ icon, color }: { icon: AchievementDef['icon']; color: string }) {
  if (icon === 'shield') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M12 2.5L4.5 5.5V11.5C4.5 16.5 7.7 20.6 12 22C16.3 20.6 19.5 16.5 19.5 11.5V5.5L12 2.5Z"
          fill={color}
          fillOpacity="0.22"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12 7.5V16.5M8.5 11.5H15.5" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'crown') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M3.5 17.5L5 7.5L9.5 12L12 5.5L14.5 12L19 7.5L20.5 17.5H3.5Z"
          fill={color}
          fillOpacity="0.28"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M4.5 20H19.5" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'bolt') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M13 2.5L5.5 13.5H11.5L10.5 21.5L18.5 10.5H12.5L13 2.5Z"
          fill={color}
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === 'moon') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5A7.5 7.5 0 1 0 19.5 14.5Z"
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === 'star') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M12 2.5L14.8 9.2L21.5 12L14.8 14.8L12 21.5L9.2 14.8L2.5 12L9.2 9.2L12 2.5Z"
          fill={color}
          fillOpacity="0.32"
          stroke={color}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (icon === 'scroll') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect
          x="5.5"
          y="3.5"
          width="13"
          height="17"
          rx="2.5"
          fill={color}
          fillOpacity="0.2"
          stroke={color}
          strokeWidth="2"
        />
        <path d="M9 8.5H15M9 12.5H15M9 16H12.5" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === 'shogun') {
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path
          d="M3.5 7.5L12 11.5L20.5 7.5L18 12.5V19H6V12.5L3.5 7.5Z"
          fill={color}
          fillOpacity="0.28"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="9.5" cy="15" r="1.1" fill="#FDE047" />
        <circle cx="14.5" cy="15" r="1.1" fill="#FDE047" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path d="M19 5L9 15" stroke="#F8FAFC" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M7.5 13.5L10.5 16.5M5 19L8 16" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function AchievementToast({ toasts }: AchievementToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-16 right-4 z-40 flex flex-col gap-2.5 max-w-xs w-full"
      aria-live="polite"
    >
      {toasts.map((item) => {
        const { achievement } = item;
        return (
          <div
            key={item.instanceId}
            className="flex items-center gap-3 bg-slate-950/92 backdrop-blur-xl border border-amber-400/50 rounded-xl px-3.5 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.75)]"
          >
            <div
              className="w-10 h-10 rounded-lg border bg-slate-900/90 flex items-center justify-center shrink-0"
              style={{ borderColor: `${achievement.badgeColor}88` }}
            >
              <AchievementIcon icon={achievement.icon} color={achievement.badgeColor} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] font-display font-bold text-amber-400 tracking-wider">
                <Award className="w-3 h-3 shrink-0" />
                <span>CONQUISTA DESBLOQUEADA</span>
              </div>
              <div className="font-display font-bold text-xs text-white truncate mt-0.5">
                {achievement.title}
              </div>
              <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                {achievement.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
