'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';

const packImageUrl = 'src/images/sobre-base-campeones-de-qatar.png';

export function CardPack() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
       <motion.div
            initial={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
        >
            <Image src={packImageUrl} alt="Sobre de cartas" width={300} height={420} priority />
        </motion.div>
    </div>
  );
}
