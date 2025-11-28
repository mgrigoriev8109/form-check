export default function VideoUploadTips() {
  return (
    <div className="mt-10 max-w-3xl mx-auto bg-secondary/10 rounded-lg p-6 border border-secondary/20">
      <h3 className="font-medium text-gray-900 mb-4 text-sm">
        Tips for best results
      </h3>
      <ul className="text-sm text-gray-600 space-y-2.5">
        <li className="flex items-start">
          <span className="text-secondary mr-2.5">•</span>
          <span>Record from the side view for squats and deadlifts</span>
        </li>
        <li className="flex items-start">
          <span className="text-secondary mr-2.5">•</span>
          <span>Ensure good lighting and the full body is visible</span>
        </li>
        <li className="flex items-start">
          <span className="text-secondary mr-2.5">•</span>
          <span>Keep the video under 30 seconds</span>
        </li>
        <li className="flex items-start">
          <span className="text-secondary mr-2.5">•</span>
          <span>Film at least one complete rep</span>
        </li>
      </ul>
    </div>
  );
}
