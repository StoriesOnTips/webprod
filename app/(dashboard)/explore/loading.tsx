export default function libraryLoading() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <svg
          className="animate-spin h-10 w-10 text-blue-500 mb-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            strokeWidth="4"
            stroke="currentColor"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />{" "}
        </svg>
        <p className="text-lg text-gray-700">Loading...</p>
      </div>
    </>
  );
}
