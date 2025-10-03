import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Mail, Linkedin } from 'lucide-react';

const developers = [
  {
    name: 'Parth Khatke',
    role: 'Full Stack Developer',
    expertise: 'React, Node.js, Database Architecture',
    email: 'parthkhatke@gmail.com',
    linkedin: 'www.linkedin.com/in/parthkhatke/'
  },
  {
    name: 'Parag Jhala',
    role: 'Software Developer Test Engineer',
    expertise: 'API Testing, Security, Cloud Infrastructure',
    email: 'paragjhala18@gmail.com',
    linkedin: 'www.linkedin.com/in/paragjhala21'
  },
  {
    name: 'Palak Shadadpuri',
    role: 'Frontend Developer',
    expertise: 'UI/UX, TypeScript, Component Design',
    email: 'Palakshahdadpuri2410@gmail.com',
    linkedin: 'linkedin.com/in/palak-shahdadpuri-659816339'
  }
];

export const DeveloperCard: React.FC = () => {
  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          Developer
        </CardTitle>
        <CardDescription>Meet the team behind Storify</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {developers.map((dev, index) => (
          <div key={index} className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
            <h4 className="font-semibold text-base">{dev.name}</h4>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[80px]">Role:</span>
                <span>{dev.role}</span>
              </p>
              <p className="text-muted-foreground flex items-start gap-2">
                <span className="font-semibold text-foreground min-w-[80px]">Expertise:</span>
                <span>{dev.expertise}</span>
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a 
                  href={`mailto:${dev.email}`}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
                <a 
                  href={`https://${dev.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
