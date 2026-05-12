'use client';
export default function NotificationsPage() {
  const notifications = [
    { id: '1', type: 'AI_INSIGHT', title: 'New AI Insight Available', body: 'Your recent feedback has been analyzed.', isRead: false, createdAt: '2 hours ago' },
    { id: '2', type: 'STATUS_UPDATE', title: 'Feedback Status Updated', body: 'Your complaint has been assigned to the Engineering team.', isRead: false, createdAt: '5 hours ago' },
    { id: '3', type: 'BADGE_EARNED', title: 'Badge Earned! 🎯', body: 'You earned "First Submission" badge.', isRead: true, createdAt: '1 day ago' },
    { id: '4', type: 'WELLNESS_TIP', title: 'Weekly Wellness Tip', body: 'Try taking short walks during breaks to boost energy.', isRead: true, createdAt: '2 days ago' },
  ];
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-text-primary mb-6">Notifications</h1>
      <div className="space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`card-elevated p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-2 border-l-brand-600' : ''}`}>
            <div className={`w-2 h-2 rounded-full mt-2 ${!n.isRead ? 'bg-brand-600' : 'bg-transparent'}`} />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-text-primary">{n.title}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{n.body}</p>
            </div>
            <span className="text-xs text-text-muted flex-shrink-0">{n.createdAt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
