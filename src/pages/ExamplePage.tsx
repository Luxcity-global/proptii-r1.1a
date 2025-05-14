import React from 'react';
import BaseLayout from '../components/layout/BaseLayout';
import { ResponsiveGrid } from '../components/layout/ResponsiveGrid';
import { H1, H2, Body, Small } from '../components/typography/ResponsiveText';

const ExamplePage: React.FC = () => {
  return (
    <BaseLayout containerSize="xl">
      <div className="space-y-8">
        {/* Responsive Typography */}
        <H1>Welcome to Proptii</H1>
        <Body>
          This is a responsive page that demonstrates our breakpoint system.
        </Body>

        {/* Responsive Grid */}
        <section className="mt-8">
          <H2 className="mb-4">Featured Properties</H2>
          <ResponsiveGrid
            cols={{
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4
            }}
            gap="6"
          >
            {/* Grid Items */}
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 p-4 rounded-lg"
              >
                <H2>Property {index + 1}</H2>
                <Body>Property description goes here</Body>
                <Small>Posted 2 days ago</Small>
              </div>
            ))}
          </ResponsiveGrid>
        </section>

        {/* Responsive Sections */}
        <section className="mt-8 grid md:grid-cols-2 gap-8">
          <div>
            <H2>About Us</H2>
            <Body>
              Learn more about our company and mission.
            </Body>
          </div>
          <div>
            <H2>Contact</H2>
            <Body>
              Get in touch with our team.
            </Body>
          </div>
        </section>
      </div>
    </BaseLayout>
  );
};

export default ExamplePage; 