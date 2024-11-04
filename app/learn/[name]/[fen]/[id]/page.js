/**
 * This file is the entry point for the /learn/[name]/[fen]/[id] route.
 * It renders the OpeningDetailsClient component, which is responsible for
 * displaying the opening details, handling user input, and fetching data
 * from the API.
 */
import OpeningDetailsClient from "./OpeningDetailsClient";

/**
 * This function takes the route parameters and returns an object with the
 * name, fen, and id of the opening to be displayed.
 * @param {Object} params - The route parameters.
 * @returns {Object} - An object with the name, fen, and id of the opening.
 */
async function getParams(params) {
  const { name, fen, id } = await params;

  return {
    name,
    fen,
    id,
  };
}

/**
 * This is the main component for the /learn/[name]/[fen]/[id] route.
 * It renders the OpeningDetailsClient component with the name, fen, and id
 * of the opening to be displayed.
 * @param {Object} props - The component props.
 * @returns {JSX.Element} - The rendered component.
 */
export default async function Page({ params }) {
  const unwrappedParams = await getParams(params);

  return (
    <OpeningDetailsClient
      name={unwrappedParams.name}
      fen={unwrappedParams.fen}
      id={unwrappedParams.id}
    />
  );
}
