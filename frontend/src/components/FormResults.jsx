const FormResults = ({ results }) => {

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="bg-white rounded-lg shadow-lg border-2 border-[#2D5016] p-6">
        <h2 className="font-black text-2xl text-[#303030] mb-4 uppercase tracking-wide">
          Form Analysis Results
        </h2>

        {/* Placeholder for parsed results */}
        <div className="bg-[#F5F5F5] rounded-lg p-4 border-l-4 border-[#DFB960]">
          <pre className="text-sm text-[#303030] whitespace-pre-wrap font-mono">
            {results.analysis}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default FormResults;
