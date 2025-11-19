const FormResults = ({ results, exerciseType }) => {

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#2D5016] p-6">
        <h2 className="font-black text-2xl text-[#303030] mb-4 uppercase tracking-wide">
          Form Analysis Results
        </h2>

        <div className="mb-4">
          <p className="text-sm text-[#303030] opacity-70 mb-2">
            Exercise: <span className="font-bold">{exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)}</span>
          </p>
        </div>

        {/* Placeholder for parsed results */}
        <div className="bg-[#F5F5F5] rounded-lg p-4 border-l-4 border-[#DFB960]">
          <pre className="text-sm text-[#303030] whitespace-pre-wrap font-mono">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>

        {/* TODO: Replace with structured rendering based on actual API response */}
        <div className="mt-4 text-sm text-[#303030] opacity-70">
          <p>
            Note: This is a placeholder. I will customize this component to parse and display
            the Claude API response in a user-friendly format.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FormResults;
