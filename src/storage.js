import * as fs from "fs";
import * as path from "path";

export async function saveDataToFile(data, fileName ) {
    try {
        const filePath = path.resolve(process.cwd(), fileName);
        console.log(`Resolved file path: ${filePath}`);
        
        await fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`Data saved to ${fileName}`);
    } catch (error) {
        console.error(`Error saving data to ${fileName}: ${error.message}`);
    }
}