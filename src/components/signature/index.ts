import React from 'react';

const SignatureCanvas = React.lazy(() => 
  import('./SignatureCanvas').then(module => ({ default: module.SignatureCanvas }))
);

export { SignatureCanvas };