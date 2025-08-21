
import Image from 'next/image';
import { SignupForm } from '../signup-form';

export default function SignupPage() {

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <SignupForm />
      </div>
       <div className="hidden bg-muted lg:block relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-80"></div>
        <Image
          src="https://placehold.co/1200x900.png"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
          data-ai-hint="education abstract"
        />
         <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center bg-black bg-opacity-30 p-8 rounded-lg backdrop-blur-sm">
            <h2 className="mt-4 text-4xl font-bold">Join the Future of Education</h2>
            <p className="mt-2 text-xl">Sign up to access a world of modern learning tools.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
