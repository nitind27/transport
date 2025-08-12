import Link from 'next/link'
import React from 'react'
interface ButtonaddProps {
    href: string; // or 'href?: string' if it's optional
  }
  const Buttonadd: React.FC<ButtonaddProps> = ({ href }) => {
    return (
        <div>
            <Link href={href}>
                <button className="bg-blue-500 text-white w-16 p-2 rounded-lg">
                    Add
                </button>
            </Link>
        </div>
    )
}

export default Buttonadd
