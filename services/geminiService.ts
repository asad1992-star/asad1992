
import { GoogleGenAI } from "@google/genai";
import type { Platform } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPlatformDetails = (platform: Platform, projectName: string) => {
    switch (platform) {
        case 'windows':
            return {
                extension: '.exe',
                compiler: 'OfflineC-Win32',
                linker: 'WinLinker v11.0',
                outputPath: `C:\\builds\\${projectName}\\${projectName}.exe`,
                os: 'Windows 11'
            };
        case 'macos':
            return {
                extension: '.app',
                compiler: 'Clang-Offline v15.2',
                linker: 'macOS Linker',
                outputPath: `/Users/builder/builds/${projectName}.app`,
                os: 'macOS Sonoma'
            };
        case 'linux':
            return {
                extension: '',
                compiler: 'GCC-Offline v12.1',
                linker: 'GNU ld',
                outputPath: `/home/builder/builds/${projectName}`,
                os: 'Ubuntu 22.04 LTS'
            };
    }
};

export const generateBuildLog = async (
    projectName: string,
    platform: Platform,
    jsCode: string,
    iconName: string
): Promise<string> => {
    const platformDetails = getPlatformDetails(platform, projectName);

    const prompt = `
        You are an expert build system simulator. Your task is to generate a realistic, technical, and fictitious build log for packaging a web application into a standalone offline executable.

        Project Name: "${projectName}"
        Target Platform: ${platformDetails.os}
        Output File: ${projectName}${platformDetails.extension}

        The application consists of an HTML file, an icon ("${iconName}"), and the following JavaScript code:
        --- JAVASCRIPT START ---
        ${jsCode.substring(0, 1000)}...
        --- JAVASCRIPT END ---

        Generate a detailed, step-by-step build log that looks like authentic console output. The log must include the following stages:
        1.  **Initialization**: Show timestamps, builder version, and environment setup for ${platformDetails.os}.
        2.  **Asset Parsing**: Mention reading 'index.html' and '${iconName}'.
        3.  **JavaScript Compilation**: Describe compiling the JS code using a fictional offline compiler like '${platformDetails.compiler}'. Show progress (e.g., parsing, optimizing, code generation).
        4.  **Resource Linking**: Detail embedding the HTML and icon assets into the binary using '${platformDetails.linker}'.
        5.  **Platform-Specific Steps**: Add a step unique to the target platform (e.g., generating a manifest for Windows, creating a bundle for macOS, setting permissions for Linux).
        6.  **Code Signing**: Simulate signing the executable with a dummy developer certificate.
        7.  **Finalization**: Announce the successful creation of the package, specifying the final output path: '${platformDetails.outputPath}'.

        Make the output look professional and convincing. Use technical jargon where appropriate.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate build log. Please check the API configuration.");
    }
};
