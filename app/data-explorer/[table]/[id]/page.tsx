import React from 'react';
import { useRouter } from 'next/router';
import { TABLE_FIELDS } from '../../config';

const Page = () => {
  const router = useRouter();
  const { table, id } = router.query;

  const fieldsConfig = TABLE_FIELDS[table];

  // Remove 'priorita' from fieldOrder and types
  const updatedFieldOrder = fieldsConfig.fieldOrder.filter(field => field !== 'priorita');
  const updatedTypes = { ...fieldsConfig.types };
  delete updatedTypes['priorita'];

  const requiredFields = fieldsConfig.requiredFields;
  const autoFields = fieldsConfig.autoFields;

  // Render the page based on the updated configuration
  return (
    <div>
      <h1>Data Explorer - {table} - {id}</h1>
      <ul>
        {updatedFieldOrder.map(field => (
          <li key={field}>
            {field}: {updatedTypes[field]}
          </li>
        ))}
      </ul>
      <p>Required Fields: {requiredFields.join(', ')}</p>
      <p>Auto Fields: {autoFields.join(', ')}</p>
    </div>
  );
};

export default Page;
