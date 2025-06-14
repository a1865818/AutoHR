interface StatusTagProps {
  status: "In Progress" | "Hired" | "Rejected";
}

export function StatusTag({ status }: StatusTagProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500 text-white";
      case "Hired":
        return "bg-green-500 text-white";
      case "Rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        status
      )}`}
    >
      {status}
    </span>
  );
}
