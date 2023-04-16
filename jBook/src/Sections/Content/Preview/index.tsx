import { forwardRef } from 'react';
import { previewTemplate } from '../../../constants/templates/preview';
import React from 'react';

const Preview = forwardRef((props: any, previewRef: any) => {
    return (
        <>
            <iframe  
                ref={previewRef}
                srcDoc={previewTemplate}   
                sandbox="allow-scripts" 
                {...props}
            />
        </>
    );
});

export default Preview;