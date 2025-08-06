import React, { useMemo } from 'react';
import { useAgendaItems } from './useAgendaItems'; // Assuming this hook is defined elsewhere

const AgendaWidget: React.FC<{ selectedDate: Date; view: string }> = ({ selectedDate, view }) => {
  // Funzione per calcolare il range di date in base alla vista
  const calculateDateRange = (selectedDate: Date, view: string) => {
    const startDate = new Date(selectedDate);
    const endDate = new Date(selectedDate);

    switch (view) {
      case 'weekly':
        // Trova il lunedì della settimana
        const dayOfWeek = startDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysToMonday);
        
        // Trova la domenica della settimana
        endDate.setDate(startDate.getDate() + 6);
        break;
        
      case 'monthly':
        // Primo giorno del mese
        startDate.setDate(1);
        
        // Ultimo giorno del mese
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
        
      case 'daily':
      default:
        // Stesso giorno per daily
        break;
    }

    // Imposta gli orari
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(`[AgendaWidget] Vista: ${view}, Range: ${startDate.toISOString()} - ${endDate.toISOString()}`);
    
    return { startDate, endDate };
  };

  // Calcola il range di date
  const { startDate, endDate } = useMemo(() => {
    return calculateDateRange(selectedDate, view);
  }, [selectedDate, view]);

  // Usa il hook con le date corrette
  const { items, isLoading, error } = useAgendaItems(startDate, endDate);

  // Rendering degli elementi dell'agenda
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <p>{item.date.toISOString()}</p>
        </div>
      ))}
    </div>
  );
};

export default AgendaWidget;
