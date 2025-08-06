import React from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { TABLE_FIELDS } from '@/config/tableFields';

const NewPage = () => {
  const router = useRouter();
  const { table } = router.query;
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log(data);
    // Logic to handle form submission
  };

  const fields = TABLE_FIELDS[table];

  return (
    <div>
      <h1>Create New {fields?.title}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        {fields?.fieldOrder.map((fieldName) => (
          <div key={fieldName}>
            <label>{fieldName}</label>
            <input {...register(fieldName)} type={fields.types[fieldName]} />
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default NewPage;
