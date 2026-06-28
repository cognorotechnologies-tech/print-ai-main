'use client';

interface TimelineStep {
  status: string;
  label: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface OrderStatusTimelineProps {
  currentStatus: string;
  createdAt: string;
  statusHistory?: Array<{
    status: string;
    createdAt: string;
  }>;
}

const statusFlow = [
  { status: 'PENDING', label: 'Order Placed' },
  { status: 'PAID', label: 'Payment Confirmed' },
  { status: 'ASSIGNED', label: 'Assigned to Vendor' },
  { status: 'IN_PRODUCTION', label: 'In Production' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const statusOrder: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  ASSIGNED: 2,
  IN_PRODUCTION: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export default function OrderStatusTimeline({
  currentStatus,
  createdAt,
  statusHistory = [],
}: OrderStatusTimelineProps) {
  // Handle cancelled orders
  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Order Cancelled</h3>
            <p className="text-sm text-red-700">
              This order has been cancelled
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = statusOrder[currentStatus] ?? 0;

  // Create timeline steps with timestamps from history
  const steps: TimelineStep[] = statusFlow.map((step, index) => {
    const historyEntry = statusHistory.find((h) => h.status === step.status);
    return {
      status: step.status,
      label: step.label,
      timestamp: historyEntry?.createdAt,
      isCompleted: index <= currentStatusIndex,
      isCurrent: index === currentStatusIndex,
    };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h3>

      <div className="relative">
        {steps.map((step, index) => (
          <div key={step.status} className="relative pb-8 last:pb-0">
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`absolute left-4 top-8 w-0.5 h-full -ml-px ${
                  step.isCompleted ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            )}

            {/* Step Content */}
            <div className="relative flex items-start gap-4">
              {/* Status Icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  step.isCompleted
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.isCompleted ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <div className="w-3 h-3 rounded-full bg-current" />
                )}
              </div>

              {/* Step Details */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    step.isCurrent
                      ? 'text-primary-600'
                      : step.isCompleted
                      ? 'text-gray-900'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(step.timestamp).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
                {step.isCurrent && !step.timestamp && (
                  <p className="text-xs text-primary-600 mt-1">In progress</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
