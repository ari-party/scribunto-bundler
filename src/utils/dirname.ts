import path from 'path';
import { fileURLToPath } from 'url';

// Inner `path.dirname` goes to `dist`, hence the outer
const dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export default dirname;
