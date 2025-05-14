
import React from 'react';

const ChatHistory: React.FC = () => {
  // Sample history data - in a real app this would come from props or a context
  const historyItems = [
    { id: 1, title: 'Chat with Sarah', timestamp: '2 hours ago' },
    { id: 2, title: 'Team discussion', timestamp: 'Yesterday' },
    { id: 3, title: 'Project planning', timestamp: '3 days ago' },
    { id: 4, title: 'Customer support', timestamp: 'Last week' },
    { id: 5, title: 'Brainstorming session', timestamp: '2 weeks ago' },
  ];

  return (
    <div className="space-y-2">
      {historyItems.map((item) => (
        <div
          key={item.id}
          className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
        >
          <h4 className="font-medium text-sm">{item.title}</h4>
          <p className="text-xs text-gray-500">{item.timestamp}</p>
        </div>
      ))}
    </div>
  );
};

export default ChatHistory;
