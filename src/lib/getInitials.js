// src/lib/getInitials.js

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getAvatarColor = (name) => {
  if (!name) return "from-slate-500 to-slate-600";
  
  const gradients = [
    "from-red-500 to-red-600",
    "from-orange-500 to-orange-600",
    "from-yellow-500 to-yellow-600",
    "from-green-500 to-green-600",
    "from-blue-500 to-blue-600",
    "from-indigo-500 to-indigo-600",
    "from-purple-500 to-purple-600",
    "from-pink-500 to-pink-600",
  ];
  
  const hash = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return gradients[hash % gradients.length];
};