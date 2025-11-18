 export default function AppHeader() {
    return (
      <div className="mt-8 bg-[#DFB960] bg-opacity-15 rounded-lg p-5 border-l-4 border-[#DFB960]">
        <h3 className="font-black text-[#303030] mb-3 uppercase tracking-wide text-sm">
          Tips for best results:
        </h3>
        <ul className="text-sm text-[#303030] space-y-2 font-medium">
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Record from the side view for squats and deadlifts
          </li>
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Ensure good lighting and the full body is visible
          </li>
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Keep the video under 30 seconds
          </li>
          <li className="flex items-start">
            <span className="text-[#DFB960] mr-2 font-bold">▸</span>
            Film at least one complete rep
          </li>
        </ul>
      </div>
    )
  }