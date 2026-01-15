/**
 * Parses symptoms from request body (handles string, JSON string, or array)
 */
export const parseSymptoms = (symptoms: any): string[] => {
  if (!symptoms) {
    return [];
  }

  if (typeof symptoms === 'string') {
    try {
      return JSON.parse(symptoms);
    } catch {
      return symptoms.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    }
  }

  if (Array.isArray(symptoms)) {
    return symptoms;
  }

  return [];
};

/**
 * Parses symptoms for update requests (allows undefined)
 */
export const parseSymptomsForUpdate = (symptoms: any): string[] | undefined => {
  if (symptoms === undefined) {
    return undefined;
  }
  return parseSymptoms(symptoms);
};

/**
 * Builds update data object from request body
 */
export const buildUpdateData = (body: {
  title?: string;
  description?: string;
  symptoms?: any;
  status?: string;
}): any => {
  const updateData: any = {};

  if (body.title) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.status) updateData.status = body.status;
  if (body.symptoms !== undefined) {
    updateData.symptoms = parseSymptomsForUpdate(body.symptoms);
  }

  return updateData;
};

