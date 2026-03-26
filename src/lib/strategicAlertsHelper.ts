import { supabase } from '@/integrations/supabase/client';

export const generateStrategicAlerts = async (userId: string, silent: boolean = true) => {
  try {
    console.log('Generating strategic alerts for user:', userId);
    
    const { data, error } = await supabase.functions.invoke('generate-strategic-alerts');
    
    if (error) {
      console.error('Strategic alerts generation error:', error);
      throw error;
    }

    console.log('Strategic alerts generated successfully:', data);

    if (!silent && data?.alertsGenerated > 0) {
      // Return success info for non-silent calls
      return {
        success: true,
        alertsGenerated: data.alertsGenerated,
        message: `Generated ${data.alertsGenerated} new strategic alerts`
      };
    }

    return { success: true, alertsGenerated: data?.alertsGenerated || 0 };
  } catch (error) {
    console.error('Error generating strategic alerts:', error);
    // Don't throw the error for silent calls to avoid disrupting the main flow
    if (silent) {
      return { success: false, error: error.message };
    }
    throw error;
  }
};