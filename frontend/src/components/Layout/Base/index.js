import React from 'react';

import Header from '../../Header'
import Footer from '../../Footer'
import './base.scss';

const Base = props => (
    //header
    //props.children is to create flexible components
    //footer
    <div className="wrapper">
        <Header />
        <section className="base-section">
            { props.children }
        </section>

        <Footer />
    </div>
)

export default Base;