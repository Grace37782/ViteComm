import prisma from '../config/db.js';
import { initiatePayment, verifyWebhookSignature, generateTransactionId, verifyTransactionStatus } from '../services/fedapayService.js';
import { internalError } from '../utils/errors.js';

const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET;

export const createPayment = async (req, res) => {
  try {
    const { id_commande, mode_paiement, telephone } = req.body;
    const id_user_client = req.user.id_user;

    if (!id_commande || !mode_paiement) {
      return res.status(400).json({ error: 'id_commande et mode_paiement requis' });
    }

    if (!['momo', 'moov', 'celtis'].includes(mode_paiement)) {
      return res.status(400).json({ error: 'mode_paiement invalide' });
    }

    const commande = await prisma.commande.findUnique({
      where: { id_commande: parseInt(id_commande) },
      include: { client: { include: { utilisateur: true } }, factures: true },
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande introuvable' });
    }

    if (commande.id_user_client !== id_user_client) {
      return res.status(403).json({ error: 'Accès interdit' });
    }

    if (commande.mode_paiement_status === 'paye') {
      return res.status(400).json({ error: 'Cette commande est déjà payée' });
    }

    const facture = commande.factures[0];
    const montant = facture
      ? facture.montant_total_du
      : commande.total_marchandises + commande.frais_livraison;
    const transaction_id = generateTransactionId();

    const transaction = await prisma.paiementTransaction.create({
      data: {
        id_user_client,
        id_commande: parseInt(id_commande),
        montant,
        mode_paiement,
        telephone: telephone || null,
        transaction_id,
        statut: 'pending',
      },
    });

    const fedapayResult = await initiatePayment({
      id_commande: parseInt(id_commande),
      montant,
      devise: 'XOF',
      mode_paiement,
      telephone,
      transaction_id,
      client_prenom: commande.client.utilisateur.prenom,
      client_nom: commande.client.utilisateur.nom,
    });

    await prisma.paiementTransaction.update({
      where: { id_paiement_transaction: transaction.id_paiement_transaction },
      data: { fedapay_transaction_id: fedapayResult.fedapay_id },
    });

    await prisma.commande.update({
      where: { id_commande: parseInt(id_commande) },
      data: { mode_paiement: 'MOBILE_MONEY', mode_paiement_status: 'en_attente' },
    });

    return res.status(201).json({
      checkout_url: fedapayResult.checkout_url,
      transaction_id,
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    const signatureHeader = req.headers['x-fedapay-signature'];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    // Skip signature verification in dev (sandbox may not send headers)
    if (FEDAPAY_WEBHOOK_SECRET) {
      const signature = verifyWebhookSignature(rawBody, signatureHeader);
      if (!signature) {
        console.warn('[Webhook] Signature invalide — rejeté');
        return res.status(400).json({ error: 'Signature invalide' });
      }
    } else {
      console.log('[Webhook] Pas de FEDAPAY_WEBHOOK_SECRET — signature ignorée (dev)');
    }

    const event = req.body;
    const eventType = event.event || event.name;
    const transactionData = event.data?.transaction || event.data;

    if (!transactionData) {
      return res.status(200).json({ received: true });
    }

    const reference = transactionData.reference || transactionData.id;

    const paiementTransaction = await prisma.paiementTransaction.findFirst({
      where: {
        OR: [
          { transaction_id: reference },
          { fedapay_transaction_id: String(transactionData.id) },
        ],
      },
      include: { commande: { include: { factures: true } } },
    });

    if (!paiementTransaction) {
      return res.status(200).json({ received: true });
    }

    if (paiementTransaction.statut === 'completed') {
      return res.status(200).json({ received: true });
    }

    if (eventType === 'transaction.approved') {
      await prisma.$transaction(async (tx) => {
        await tx.paiementTransaction.update({
          where: { id_paiement_transaction: paiementTransaction.id_paiement_transaction },
          data: {
            statut: 'completed',
            paid_at: new Date(),
            provider_response: transactionData,
          },
        });

        const facture = paiementTransaction.commande.factures[0];
        if (facture) {
          await tx.paiement.create({
            data: {
              montant_percu: paiementTransaction.montant,
              mode_reglement: 'MOBILE_MONEY',
              reference_transaction: paiementTransaction.transaction_id,
              statut: 'Effectue',
              id_facture: facture.id_facture,
            },
          });
          await tx.facture.update({
            where: { id_facture: facture.id_facture },
            data: { statut_paiement: 'Paye' },
          });
        } else {
          const cmd = paiementTransaction.commande;
          const newFacture = await tx.facture.create({
            data: {
              id_commande: cmd.id_commande,
              montant_marchandises: cmd.total_marchandises,
              montant_frais_livraison: cmd.frais_livraison,
              montant_frais_retour: 0,
              montant_commission: cmd.commission,
              montant_total_du: cmd.total_marchandises + cmd.frais_livraison,
              statut_paiement: 'Paye',
            },
          });
          await tx.paiement.create({
            data: {
              montant_percu: paiementTransaction.montant,
              mode_reglement: 'MOBILE_MONEY',
              reference_transaction: paiementTransaction.transaction_id,
              statut: 'Effectue',
              id_facture: newFacture.id_facture,
            },
          });
        }

        await tx.commande.update({
          where: { id_commande: paiementTransaction.id_commande },
          data: { mode_paiement_status: 'paye' },
        });
      });
    } else if (eventType === 'transaction.declined') {
      await prisma.paiementTransaction.update({
        where: { id_paiement_transaction: paiementTransaction.id_paiement_transaction },
        data: {
          statut: 'failed',
          failure_reason: transactionData.reason || 'Paiement refusé',
          provider_response: transactionData,
        },
      });

      await prisma.commande.update({
        where: { id_commande: paiementTransaction.id_commande },
        data: { mode_paiement_status: 'echoue' },
      });
    } else if (eventType === 'transaction.canceled') {
      await prisma.paiementTransaction.update({
        where: { id_paiement_transaction: paiementTransaction.id_paiement_transaction },
        data: { statut: 'cancelled', provider_response: transactionData },
      });

      await prisma.commande.update({
        where: { id_commande: paiementTransaction.id_commande },
        data: { mode_paiement_status: 'echoue' },
      });
    }

    return res.status(200).json({ received: true });
  } catch {
    return res.status(200).json({ received: true });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { transaction_id } = req.params;
    const id_user_client = req.user.id_user;

    const transaction = await prisma.paiementTransaction.findFirst({
      where: {
        transaction_id,
        id_user_client,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction introuvable' });
    }

    // If still pending, verify with FedaPay API (webhook may not have fired in dev)
    if (transaction.statut === 'pending' && transaction.fedapay_transaction_id) {
      const fedapayStatus = await verifyTransactionStatus(transaction.fedapay_transaction_id);

      if (fedapayStatus === 'approved') {
        // Simulate webhook processing
        await prisma.$transaction(async (tx) => {
          await tx.paiementTransaction.update({
            where: { id_paiement_transaction: transaction.id_paiement_transaction },
            data: { statut: 'completed', paid_at: new Date() },
          });
          const cmd = await tx.commande.findUnique({
            where: { id_commande: transaction.id_commande },
            include: { factures: true },
          });
          const facture = cmd?.factures[0];
          if (facture) {
            await tx.paiement.create({
              data: {
                montant_percu: transaction.montant,
                mode_reglement: 'MOBILE_MONEY',
                reference_transaction: transaction.transaction_id,
                statut: 'Effectue',
                id_facture: facture.id_facture,
              },
            });
            await tx.facture.update({ where: { id_facture: facture.id_facture }, data: { statut_paiement: 'Paye' } });
          } else if (cmd) {
            const newFacture = await tx.facture.create({
              data: {
                id_commande: cmd.id_commande, montant_marchandises: cmd.total_marchandises,
                montant_frais_livraison: cmd.frais_livraison, montant_frais_retour: 0,
                montant_commission: cmd.commission, montant_total_du: cmd.total_marchandises + cmd.frais_livraison,
                statut_paiement: 'Paye',
              },
            });
            await tx.paiement.create({
              data: {
                montant_percu: transaction.montant, mode_reglement: 'MOBILE_MONEY',
                reference_transaction: transaction.transaction_id, statut: 'Effectue',
                id_facture: newFacture.id_facture,
              },
            });
          }
          await tx.commande.update({ where: { id_commande: transaction.id_commande }, data: { mode_paiement_status: 'paye' } });
        });
        transaction.statut = 'completed';
        transaction.paid_at = new Date();
      } else if (fedapayStatus === 'declined' || fedapayStatus === 'canceled') {
        await prisma.paiementTransaction.update({
          where: { id_paiement_transaction: transaction.id_paiement_transaction },
          data: { statut: 'failed' },
        });
        await prisma.commande.update({
          where: { id_commande: transaction.id_commande },
          data: { mode_paiement_status: 'echoue' },
        });
        transaction.statut = 'failed';
      }
    }

    return res.json({
      statut: transaction.statut,
      montant: transaction.montant,
      mode_paiement: transaction.mode_paiement,
      paid_at: transaction.paid_at,
    });
  } catch (error) {
    return res.status(500).json({ error: internalError(error) });
  }
};

export const handleCallback = async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.redirect('/client/panier');
    }

    const transaction = await prisma.paiementTransaction.findFirst({
      where: { transaction_id: reference },
    });

    if (transaction?.statut === 'completed') {
      return res.redirect(`/client/paiement?ref=${reference}&status=success`);
    }

    return res.redirect(`/client/paiement?ref=${reference}&status=pending`);
  } catch {
    return res.redirect('/client/panier');
  }
};
