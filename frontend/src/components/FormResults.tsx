interface FormResultsProps {
  results: {
    analysis: string;
  };
}

const FormResults = ({ results }: FormResultsProps) => {

  return (
    <div className="max-w-3xl mx-auto mt-8">
        <div className="bg-white rounded-lg p-6 border-l-4 border-secondary">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
            {results.analysis}
          </pre>
        </div>
    </div>
  );
};

export default FormResults;
