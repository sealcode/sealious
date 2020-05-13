import { promisify } from "util";
export default promisify((delay: number, callback: () => void) =>
	setTimeout(callback, delay)
);
