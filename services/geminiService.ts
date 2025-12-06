import { GoogleGenAI } from "@google/genai";
import { Order } from "../types";

const API_KEY = process.env.API_KEY || ''; // Assumption: injected by environment

export const analyzeOrderRisk = async (order: Partial<Order>): Promise<string> => {
  if (!API_KEY) return "Service AI non disponible (Clé manquante)";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
      Tu es un assistant IA pour un système de logistique nommé Moisson Manager.
      Analyse cette commande et fournis un court résumé (max 20 mots) indiquant la catégorie probable du produit et si cela semble être une commande à haut risque (basé sur le prix et l'urgence).
      
      Produit: ${order.productName}
      Description: ${order.description}
      Prix: ${order.price}
      Urgence: ${order.urgency}
      Ville: ${order.city}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Analyse indisponible.";
  }
};