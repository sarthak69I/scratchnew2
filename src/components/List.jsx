import Image from "next/image";
import { FaChevronRight } from "react-icons/fa";
import styles from "@/styles/List.module.css";

export default function ListItem({ image, title, paragraph, onClick }) {
    return (
        <div className={styles.listItem} onClick={onClick}>
            <div className={styles.listLeft}>
                <Image src={image} height={45} width={45} alt="image" draggable={false} />
            </div>
            <div className={styles.listRight}>
                <div className={styles.left}>
                    <p>{title}</p>
                    <p>{paragraph}</p>
                </div>
                <div className={styles.right}>
                    <FaChevronRight />
                </div>
            </div>
        </div>
    );
}
